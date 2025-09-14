import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsEntity } from 'src/news/news.entity';
import { InteractionEventEntity } from './entities/interaction-event.entity';
import { NewsReactionEntity } from './entities/news-reaction.entity';
import { NewsCommentEntity } from './entities/news-comment.entity';
import { NewsShareEntity } from './entities/news-share.entity';
import type { ReactionType } from '@shared/types/v2/interactions';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(NewsEntity) private news: Repository<NewsEntity>,
    @InjectRepository(InteractionEventEntity) private events: Repository<InteractionEventEntity>,
    @InjectRepository(NewsReactionEntity) private reactions: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity) private comments: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity) private shares: Repository<NewsShareEntity>,
  ) {}

  async assertNews(companyId: string, newsId: string) {
    const n = await this.news.findOne({ where: { id: newsId } });
    if (!n || n.companyId !== companyId) throw new ForbiddenException('Not allowed');
    return n;
  }

  async markOpen(companyId: string, newsId: string, userId?: string) {
    await this.assertNews(companyId, newsId);
    const ev = this.events.create({ companyId, newsId, userId: userId || null, type: 'OPEN' });
    return this.events.save(ev);
  }

  async acknowledge(companyId: string, newsId: string, userId?: string) {
    await this.assertNews(companyId, newsId);
    const ev = this.events.create({ companyId, newsId, userId: userId || null, type: 'ACK' });
    return this.events.save(ev);
  }

  async react(companyId: string, newsId: string, userId: string | undefined, reaction: ReactionType) {
    await this.assertNews(companyId, newsId);
    const existing = await this.reactions.findOne({ where: { companyId, newsId, userId: userId || null } });
    if (existing) {
      existing.reaction = reaction;
      return this.reactions.save(existing);
    }
    const row = this.reactions.create({ companyId, newsId, userId: userId || null, reaction });
    return this.reactions.save(row);
  }

  async comment(companyId: string, newsId: string, userId: string | undefined, text: string, moderate: boolean) {
    await this.assertNews(companyId, newsId);
    const row = this.comments.create({
      companyId, newsId, userId: userId || null, text, approved: !moderate,
      approvedAt: !moderate ? new Date() : null,
    });
    return this.comments.save(row);
  }

  async moderateComment(companyId: string, newsId: string, commentId: string, approve: boolean, adminId: string) {
    const row = await this.comments.findOne({ where: { id: commentId, newsId, companyId } });
    if (!row) throw new ForbiddenException('Comment not found');
    row.approved = approve;
    row.approvedBy = adminId;
    row.approvedAt = new Date();
    return this.comments.save(row);
  }

  async share(companyId: string, newsId: string, userId: string | undefined, channel: 'app' | 'external', meta?: any) {
    await this.assertNews(companyId, newsId);
    const row = this.shares.create({ companyId, newsId, userId: userId || null, channel, meta });
    return this.shares.save(row);
  }

  // helpers de leitura (para feed e analytics)
  async snapshotForNews(companyId: string, newsId: string) {
    const [opens, acks, reacts, cmts, shrs] = await Promise.all([
      this.events.find({ where: { companyId, newsId, type: 'OPEN' } }),
      this.events.find({ where: { companyId, newsId, type: 'ACK' } }),
      this.reactions.find({ where: { companyId, newsId } }),
      this.comments.find({ where: { companyId, newsId, approved: true } }),
      this.shares.find({ where: { companyId, newsId } }),
    ]);
    const uniqueOpened = new Set(opens.map(o => o.userId || `anon:${o.id}`)).size;
    const reactionsCount: Record<string, number> = {};
    reacts.forEach(r => reactionsCount[r.reaction] = (reactionsCount[r.reaction] || 0) + 1);

    return {
      totalOpens: opens.length,
      uniqueOpens: uniqueOpened,
      acknowledgements: acks.length,
      reactions: reactionsCount,
      comments: cmts.length,
      shares: shrs.length,
    };
  }

  async hasOpened(companyId: string, newsId: string, userId: string) {
    const c = await this.events.count({ where: { companyId, newsId, userId, type: 'OPEN' } });
    return c > 0;
  }

  async hasAck(companyId: string, newsId: string, userId: string) {
    const c = await this.events.count({ where: { companyId, newsId, userId, type: 'ACK' } });
    return c > 0;
  }

  async myReaction(companyId: string, newsId: string, userId: string) {
    const r = await this.reactions.findOne({ where: { companyId, newsId, userId } });
    return r?.reaction;
  }

  async myCommentsCount(companyId: string, newsId: string, userId: string) {
    return this.comments.count({ where: { companyId, newsId, userId, approved: true } });
  }
}