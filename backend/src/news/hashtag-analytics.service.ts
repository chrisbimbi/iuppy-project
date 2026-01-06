import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HashtagAnalyticsService {
    constructor(private readonly ds: DataSource) { }

    async getTopHashtags(companyId: string, limit = 10): Promise<{ hashtag: string; count: number; views: number }[]> {
        const sql = `
      WITH tag_stats AS (
        SELECT 
          tag, 
          COUNT(DISTINCT n.id) as post_count,
          COUNT(DISTINCT ie.id) FILTER (WHERE ie.type = 'OPEN') as view_count
        FROM news_entity n
        CROSS JOIN UNNEST(n.hashtags) as tag
        LEFT JOIN news_interaction_event ie ON ie."newsId" = n.id
        WHERE n."companyId" = $1 AND n."isPublished" = true
        GROUP BY tag
      )
      SELECT tag, post_count, view_count
      FROM tag_stats
      ORDER BY post_count DESC, view_count DESC
      LIMIT $2
    `;
        const rows = await this.ds.query(sql, [companyId, limit]);
        return rows.map((r: any) => ({
            hashtag: r.tag,
            count: Number(r.post_count),
            views: Number(r.view_count)
        }));
    }

    async getHashtagEngagement(companyId: string, hashtag: string): Promise<{ views: number; reactions: number; comments: number }> {
        // This is a simplified aggregation. For more accurate results, we might need to join with interaction tables.
        // However, since we don't have a direct link from interaction to hashtag, we aggregate via news.
        const sql = `
      WITH news_with_tag AS (
        SELECT id
        FROM news_entity
        WHERE "companyId" = $1 AND $2 = ANY(hashtags)
      )
      SELECT
        (SELECT COUNT(*) FROM news_interaction_event WHERE "newsId" IN (SELECT id FROM news_with_tag) AND type = 'OPEN') as views,
        (SELECT COUNT(*) FROM news_reaction WHERE "newsId" IN (SELECT id FROM news_with_tag)) as reactions,
        (SELECT COUNT(*) FROM news_comment WHERE "newsId" IN (SELECT id FROM news_with_tag)) as comments
    `;

        // Check if tables exist before querying to avoid errors if modules are disabled/missing
        // But assuming core tables exist.

        try {
            const rows = await this.ds.query(sql, [companyId, hashtag]);
            const r = rows[0];
            return {
                views: Number(r.views || 0),
                reactions: Number(r.reactions || 0),
                comments: Number(r.comments || 0)
            };
        } catch (e) {
            console.error('Error fetching hashtag engagement:', e);
            return { views: 0, reactions: 0, comments: 0 };
        }
    }
}
