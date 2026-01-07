import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialPostEntity } from './entities/social-post.entity';
import { Channel } from '../../channels/channel.entity';
import { SocialCommentEntity } from './entities/social-comment.entity';
import { SocialReactionEntity } from './entities/social-reaction.entity';
import { SocialInteractionEventEntity } from './entities/social-interaction-event.entity';
import { SocialPostStatus, SocialPostMedia, SocialInteractionType } from '@shared/types';
import { UserEntity } from '../../users/user.entity';

@Injectable()
export class SocialService {
    constructor(
        @InjectRepository(SocialPostEntity)
        private readonly postRepo: Repository<SocialPostEntity>,
        @InjectRepository(SocialCommentEntity)
        private readonly commentRepo: Repository<SocialCommentEntity>,
        @InjectRepository(SocialReactionEntity)
        private readonly reactionRepo: Repository<SocialReactionEntity>,
        @InjectRepository(SocialInteractionEventEntity)
        private readonly eventRepo: Repository<SocialInteractionEventEntity>,
        @InjectRepository(Channel)
        private readonly channelRepo: Repository<Channel>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async createPost(
        companyId: string,
        authorId: string,
        channelId: string,
        content: string,
        media: SocialPostMedia[],
    ) {
        const post = this.postRepo.create({
            companyId,
            authorId,
            channelId,
            content,
            media,
            status: SocialPostStatus.APPROVED, // For MVP, auto-approve
        });

        const saved = await this.postRepo.save(post);

        // Emit gamification event for post creation
        this.eventEmitter.emit('post.create', {
            userId: authorId,
            postId: saved.id,
            companyId,
        });

        return saved;
    }

    async getFeed(companyId: string, userId: string, requestedChannelIds: string[], userGroups: string[] = [], page = 1, limit = 20) {
        // 1. Fetch all allowed channels for this user in this company
        // Logic: Channel is allowed if:
        // - It belongs to company
        // - AND (groupIds IS NULL OR empty OR groupIds overlaps with userGroups)
        // - AND (spaceIds... we might ignore space logic for social wall or assume groups cover it, but let's stick to groups for now as primary segmentation)

        // We fetch minimal fields: id, groupIds
        const allChannels = await this.channelRepo.find({
            where: { companyId },
            select: ['id', 'groupIds', 'type'],
        });

        const allowedChannelIds = allChannels
            .filter(ch => {
                // Only 'SOCIAL' type? Or any channel that might have posts attached?
                // Let's assume only SOCIAL type matters for the feed, OR if we attach posts to articles channels too.
                // For Social Wall, filtering by type === SOCIAL is safer to avoid noise.
                if (ch.type !== 'social') {
                    // console.log(`Skipping channel ${ch.id} because type is ${ch.type}`);
                    // return false; 
                }

                if (!ch.groupIds || ch.groupIds.length === 0) return true; // Public to company
                return ch.groupIds.some(g => userGroups.includes(g));
            })
            .map(ch => ch.id);

        if (allowedChannelIds.length === 0) {
            return { posts: [], total: 0, page, limit };
        }

        // 2. Intersect with requestedChannelIds if provided
        let targetIds = allowedChannelIds;
        if (requestedChannelIds && requestedChannelIds.length > 0) {
            targetIds = allowedChannelIds.filter(id => requestedChannelIds.includes(id));
        }

        if (targetIds.length === 0) {
            return { posts: [], total: 0, page, limit };
        }

        // 3. Query Posts
        const skip = (page - 1) * limit;

        const [posts, total] = await this.postRepo.findAndCount({
            where: {
                companyId,
                channelId: In(targetIds),
                status: SocialPostStatus.APPROVED,
            },
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
            relations: ['author'],
        });

        return { posts, total, page, limit };
    }

    async getPost(companyId: string, postId: string) {
        const post = await this.postRepo.findOne({
            where: { id: postId, companyId },
            relations: ['author']
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async addReaction(companyId: string, userId: string, postId: string, type = 'LIKE') {
        const existing = await this.reactionRepo.findOne({ where: { postId, userId, type } });
        if (existing) {
            // Toggle off if exists? Or just return. Let's toggle off (unlike)
            await this.reactionRepo.remove(existing);
            await this.decrementReactionCount(postId);
            return { action: 'removed' };
        }

        const reaction = this.reactionRepo.create({ companyId, userId, postId, type });
        await this.reactionRepo.save(reaction);
        await this.incrementReactionCount(postId);
        await this.logEvent(companyId, postId, userId, 'LIKE');

        // Emit gamification event
        this.eventEmitter.emit('post.reaction', {
            userId,
            postId,
            reaction: type,
            companyId,
        });

        return { action: 'added' };
    }

    async addComment(companyId: string, userId: string, postId: string, content: string) {
        const comment = this.commentRepo.create({
            companyId, postId, authorId: userId, content
        });
        await this.commentRepo.save(comment);
        await this.incrementCommentCount(postId);
        await this.logEvent(companyId, postId, userId, 'COMMENT');

        // Emit gamification event
        this.eventEmitter.emit('post.comment', {
            userId,
            postId,
            commentId: comment.id,
            companyId,
        });

        return comment;
    }

    private async incrementReactionCount(postId: string) {
        await this.postRepo.increment({ id: postId }, 'reactionsCount', 1);
    }

    private async decrementReactionCount(postId: string) {
        await this.postRepo.decrement({ id: postId }, 'reactionsCount', 1);
    }

    private async incrementCommentCount(postId: string) {
        await this.postRepo.increment({ id: postId }, 'commentsCount', 1);
    }

    private async logEvent(companyId: string, postId: string, userId: string, type: SocialInteractionType) {
        // Async logging, don't await strictly if performance matters
        this.eventRepo.save({
            companyId,
            postId,
            userId,
            type,
        }).catch(e => console.error('Failed to log social event', e));
    }
}
