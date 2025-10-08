import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from 'src/news/news.entity';
import { InteractionEventEntity } from './entities/interaction-event.entity';
import { NewsReactionEntity } from './entities/news-reaction.entity';
import { NewsCommentEntity } from './entities/news-comment.entity';
import { NewsShareEntity } from './entities/news-share.entity';

const REACTIONS = ['like', 'love', 'clap', 'smile', 'neutral', 'angry'] as const;
type ReactionType = (typeof REACTIONS)[number];

function normalizeReaction(v: unknown): ReactionType {
  const r = String(v ?? '').trim().toLowerCase();
  if (!REACTIONS.includes(r as ReactionType)) {
    throw new BadRequestException(`invalid reaction. allowed: ${REACTIONS.join(', ')}`);
  }
  return r as ReactionType;
}

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(NewsEntity) private news: Repository<NewsEntity>,
    @InjectRepository(InteractionEventEntity) private events: Repository<InteractionEventEntity>,
    @InjectRepository(NewsReactionEntity) private reactions: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity) private comments: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity) private shares: Repository<NewsShareEntity>,
  ) { }

  async assertNews(companyId: string, newsId: string) {
    const n = await this.news.findOne({ where: { id: newsId } });
    if (!n || (n as any).companyId !== companyId) throw new ForbiddenException('Not allowed');
    return n;
  }

  /** Upsert idempotente de evento (OPEN/ACK) com ON CONFLICT */
  private async upsertEvent(
    companyId: string,
    newsId: string,
    userId: string | null | undefined,
    type: 'OPEN' | 'ACK',
  ) {
    await this.assertNews(companyId, newsId);

    // garanta que bate com o nome real da tabela
    const table = this.events.metadata.tableName || 'news_interaction_event';

    // usa as COLUNAS no ON CONFLICT (não o nome da constraint)
    const params = [companyId, newsId, userId ?? null, type];
    const inserted = await this.events.query(
      `INSERT INTO ${table} ("companyId","newsId","userId","type")
     VALUES ($1,$2,$3,$4)
     ON CONFLICT ("companyId","newsId","userId","type") DO NOTHING
     RETURNING id, "createdAt"`,
      params,
    );

    if (inserted?.[0]) return inserted[0];

    const existing = await this.events.query(
      `SELECT id, "createdAt"
       FROM ${table}
      WHERE "companyId"=$1 AND "newsId"=$2 AND "userId"=$3 AND "type"=$4
      ORDER BY "createdAt" DESC
      LIMIT 1`,
      params,
    );

    return existing?.[0] ?? { ok: true };
  }

  async markOpen(companyId: string, newsId: string, userId?: string) {
    return this.upsertEvent(companyId, newsId, userId, 'OPEN');
  }

  async acknowledge(companyId: string, newsId: string, userId?: string) {
    return this.upsertEvent(companyId, newsId, userId, 'ACK');
  }

  /** Upsert de reação: define/atualiza o tipo para o usuário. */
  async react(companyId: string, newsId: string, userId: string | undefined, reactionIn: unknown) {
    await this.assertNews(companyId, newsId);
    const reaction = normalizeReaction(reactionIn);

    const existing = await this.reactions.findOne({ where: { companyId, newsId, userId: userId || null } });
    if (existing) {
      (existing as any).reaction = reaction;
      return this.reactions.save(existing);
    }
    const row = this.reactions.create({ companyId, newsId, userId: userId || null, reaction: reaction as any });
    return this.reactions.save(row);
  }

  /** Remove a reação do usuário (idempotente) */
  async unreact(companyId: string, newsId: string, userId?: string) {
    await this.assertNews(companyId, newsId);
    await this.reactions.delete({ companyId, newsId, userId: userId || null as any });
    return { ok: true };
  }

  async comment(companyId: string, newsId: string, userId: string | undefined, textIn: unknown, moderate: boolean) {
    await this.assertNews(companyId, newsId);
    const text = String(textIn ?? '').trim();
    if (!text) throw new BadRequestException('text is required');

    const row = this.comments.create({
      companyId, newsId, userId: userId || null, text,
      approved: !moderate,
      approvedAt: !moderate ? new Date() : null,
    });
    return this.comments.save(row);
  }

  async moderateComment(companyId: string, newsId: string, commentId: string, approve: boolean, adminId: string) {
    const row = await this.comments.findOne({ where: { id: commentId, newsId, companyId } });
    if (!row) throw new ForbiddenException('Comment not found');
    row.approved = approve;
    (row as any).approvedBy = adminId;
    row.approvedAt = new Date();
    return this.comments.save(row);
  }

  async share(companyId: string, newsId: string, userId: string | undefined, channel: 'app' | 'external', meta?: any) {
    await this.assertNews(companyId, newsId);
    const row = this.shares.create({ companyId, newsId, userId: userId || null, channel, meta });
    return this.shares.save(row);
  }

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
    reacts.forEach(r => reactionsCount[(r as any).reaction] = (reactionsCount[(r as any).reaction] || 0) + 1);

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
    return (r as any)?.reaction as ReactionType | undefined;
  }

  async myCommentsCount(companyId: string, newsId: string, userId: string) {
    return this.comments.count({ where: { companyId, newsId, userId, approved: true } });
  }
}