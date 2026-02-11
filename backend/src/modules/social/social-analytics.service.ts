import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SocialPostEntity } from './entities/social-post.entity';
import { SocialInteractionEventEntity } from './entities/social-interaction-event.entity';

@Injectable()
export class SocialAnalyticsService {
    constructor(
        @InjectRepository(SocialPostEntity)
        private readonly postRepo: Repository<SocialPostEntity>,
        @InjectRepository(SocialInteractionEventEntity)
        private readonly eventRepo: Repository<SocialInteractionEventEntity>,
        private readonly ds: DataSource,
    ) { }

    async getDashboardStats(companyId: string) {
        const totalPosts = await this.postRepo.count({ where: { companyId } });
        const totalInteractions = await this.eventRepo.count({ where: { companyId } });

        // Simple Engagement Rate: Interactions / Posts (Naive)
        const engagementRate = totalPosts > 0 ? (totalInteractions / totalPosts).toFixed(2) : 0;

        // Group Leaderboards
        const groupStats = await this.getLeaderboardGroups(companyId, 50); // Get top 50 to find bottom
        const topGroups = groupStats.topGroupsInteractions.slice(0, 5);
        const bottomGroups = [...groupStats.topGroupsInteractions].reverse().slice(0, 5); // Warning: Only shows bottom of ACTIVE groups, not groups with 0 interactions.

        // For true "disconnected" groups, we would need to fetch ALL groups and left join. 
        // For now, "Least Active among Active" is a good start.

        return {
            totalPosts,
            totalInteractions,
            engagementRate,
            topGroups,
            bottomGroups,
            topPosters: (await this.getLeaderboardUsers(companyId, 5)).topPosters
        };
    }

    async getHeatmap(companyId: string) {
        // Aggregate interactions by Hour and Day of Week
        // Postgres specific
        const sql = `
      SELECT 
        EXTRACT(DOW FROM "createdAt") as day,
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count
      FROM social_interaction_events
      WHERE "companyId" = $1
      GROUP BY day, hour
      ORDER BY day, hour
    `;
        return this.ds.query(sql, [companyId]);
    }

    async getWordCloud(companyId: string) {
        // Very naive implementation: just tokenizing post content on the fly
        // Production would use ElasticSearch or a dedicated TSVECTOR column

        const posts = await this.postRepo.find({
            where: { companyId },
            select: ['content'],
            take: 100 // Sample last 100 posts
        });

        const wordsMap: Record<string, number> = {};
        posts.forEach(p => {
            const words = p.content.toLowerCase().split(/\s+/);
            words.forEach(w => {
                if (w.length > 3) { // Filter short words
                    wordsMap[w] = (wordsMap[w] || 0) + 1;
                }
            });
        });

        return Object.entries(wordsMap).map(([text, value]) => ({ text, value })).sort((a, b) => b.value - a.value).slice(0, 50);
    }

    async getLeaderboardUsers(companyId: string, limit = 10) {
        // Top Posters
        const topPosters = await this.postRepo
            .createQueryBuilder('p')
            .select('p.authorId', 'userId')
            .addSelect('COUNT(p.id)', 'count')
            .where('p.companyId = :companyId', { companyId })
            .groupBy('p.authorId')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        // Top Interactors
        const topInteractors = await this.eventRepo
            .createQueryBuilder('e')
            .select('e.userId', 'userId')
            .addSelect('COUNT(e.id)', 'count')
            .where('e.companyId = :companyId', { companyId })
            .andWhere('e.userId IS NOT NULL')
            .groupBy('e.userId')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        // Fetch User Details
        const userIds = [
            ...new Set([
                ...topPosters.map((r) => r.userId),
                ...topInteractors.map((r) => r.userId),
            ]),
        ];

        if (userIds.length === 0) return { topPosters: [], topInteractors: [] };

        // Assuming you have access to UserEntity repo, or join directly. 
        // For simplicity, query raw or inject user repo if needed. 
        // Here we use query builder on a known table 'user_entity'
        const users = await this.ds
            .getRepository('user_entity')
            .createQueryBuilder('u')
            .select(['u.id', 'u.name', 'u.avatarUrl', 'u.jobTitle'])
            .where('u.id IN (:...ids)', { ids: userIds })
            .getMany();

        const userMap = new Map(users.map(u => [u.id, u]));

        return {
            topPosters: topPosters.map(r => ({ ...r, user: userMap.get(r.userId) })),
            topInteractors: topInteractors.map(r => ({ ...r, user: userMap.get(r.userId) })),
        };
    }

    async getLeaderboardGroups(companyId: string, limit = 10) {
        // Top Groups by Posts
        // We attribute a post to ALL groups the author belongs to.
        const topGroupsPosts = await this.postRepo.manager.query(`
            SELECT unnest(u.groups) as "groupName", COUNT(p.id) as "count"
            FROM social_posts p
            JOIN user_entity u ON p."authorId" = u.id
            WHERE p."companyId" = $1
            GROUP BY "groupName"
            ORDER BY "count" DESC
            LIMIT $2
        `, [companyId, limit]);

        // Top Groups by Interactions
        const topGroupsInteractions = await this.eventRepo.manager.query(`
            SELECT unnest(u.groups) as "groupName", COUNT(e.id) as "count"
            FROM social_interaction_events e
            JOIN user_entity u ON e."userId" = u.id
            WHERE e."companyId" = $1
            GROUP BY "groupName"
            ORDER BY "count" DESC
            LIMIT $2
        `, [companyId, limit]);

        return {
            topGroupsPosts,
            topGroupsInteractions
        };
    }

    async getPostPerformance(companyId: string, page = 1, limit = 20) {
        const qb = this.postRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.author', 'author') // Assuming relation exists, if not need to add it or fetch separately
            .leftJoin('social_interaction_events', 'views', 'views.postId = p.id AND views.type = :viewType', { viewType: 'VIEW' })
            .leftJoin('social_interaction_events', 'likes', 'likes.postId = p.id AND likes.type = :likeType', { likeType: 'LIKE' })
            .leftJoin('social_comments', 'comments', 'comments.postId = p.id')
            .select([
                'p.id', 'p.content', 'p.createdAt', 'p.media',
                'author.name', 'author.avatarUrl'
            ])
            .addSelect('COUNT(DISTINCT views.id)', 'viewCount')
            .addSelect('COUNT(DISTINCT likes.id)', 'likeCount')
            .addSelect('COUNT(DISTINCT comments.id)', 'commentCount')
            .where('p.companyId = :companyId', { companyId })
            .groupBy('p.id, author.id')
            .orderBy('p.createdAt', 'DESC')
            .offset((page - 1) * limit)
            .limit(limit);

        const items = await qb.getRawMany();

        // Map raw results to cleaner structure
        return items.map(i => ({
            id: i.p_id,
            content: i.p_content,
            media: i.p_media,
            createdAt: i.p_createdAt,
            author: { name: i.author_name, avatarUrl: i.author_avatarUrl },
            metrics: {
                views: Number(i.viewCount),
                likes: Number(i.likeCount),
                comments: Number(i.commentCount),
                // Naive CTR/Engagement calc
                engagement: Number(i.viewCount) > 0 ? ((Number(i.likeCount) + Number(i.commentCount)) / Number(i.viewCount) * 100).toFixed(1) : 0
            }
        }));
    }
}
