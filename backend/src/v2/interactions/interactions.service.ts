import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NewsEntity } from 'src/news/news.entity';
import { InteractionEventEntity } from './entities/interaction-event.entity';
import { NewsReactionEntity } from './entities/news-reaction.entity';
import { NewsCommentEntity } from './entities/news-comment.entity';
import { NewsShareEntity } from './entities/news-share.entity';

const REACTIONS = [
  'like',
  'love',
  'clap',
  'smile',
  'neutral',
  'angry',
] as const;
type ReactionType = (typeof REACTIONS)[number];

function normalizeReaction(v: unknown): ReactionType {
  const r = String(v ?? '')
    .trim()
    .toLowerCase();
  if (!REACTIONS.includes(r as ReactionType)) {
    throw new BadRequestException(
      `invalid reaction. allowed: ${REACTIONS.join(', ')}`,
    );
  }
  return r as ReactionType;
}

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger('InteractionsService');

  constructor(
    @InjectRepository(NewsEntity) private news: Repository<NewsEntity>,
    @InjectRepository(InteractionEventEntity)
    private events: Repository<InteractionEventEntity>,
    @InjectRepository(NewsReactionEntity)
    private reactions: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity)
    private comments: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity)
    private shares: Repository<NewsShareEntity>,
    private readonly ds: DataSource,
  ) { }

  private async assertNews(companyId: string, newsId: string) {
    const n = await this.news.findOne({ where: { id: newsId } });
    if (!n || (n as any).companyId !== companyId)
      throw new ForbiddenException('Not allowed');
    return n;
  }

  /** ACK idempotente (há índice único parcial p/ ACK) */
  private async upsertAck(
    companyId: string,
    newsId: string,
    userId: string | null | undefined,
  ) {
    await this.assertNews(companyId, newsId);
    const table = this.events.metadata.tableName || 'news_interaction_event';
    const params = [companyId, newsId, userId ?? null, 'ACK'];
    await this.events.query(
      `INSERT INTO ${table} ("companyId","newsId","userId","type")
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      params,
    );
    this.logger.debug(
      `[ACK] company=${companyId} news=${newsId} user=${userId}`,
    );
  }

  /**
   * OPEN registra TODAS as aberturas (após migração não há unicidade de OPEN).
   * Se meta.origin='push' e houver userId, marca openedAt em push_delivery (primeira vez).
   */
  private async insertOpen(
    companyId: string,
    newsId: string,
    userId: string | null | undefined,
    meta?: any,
  ) {
    await this.assertNews(companyId, newsId);
    const table = this.events.metadata.tableName || 'news_interaction_event';
    const params = [companyId, newsId, userId ?? null, 'OPEN', meta ?? null];

    // ⇨ sem ON CONFLICT aqui: queremos múltiplos OPENs
    await this.events.query(
      `INSERT INTO ${table} ("companyId","newsId","userId","type","meta")
       VALUES ($1,$2,$3,$4,$5)`,
      params,
    );

    const origin = String(meta?.origin || '').toLowerCase();
    if (origin === 'push' && userId) {
      await this.ds.query(
        `UPDATE push_delivery
            SET "openedAt" = COALESCE("openedAt", now())
          WHERE "companyId"=$1 AND "newsId"=$2 AND "userId"=$3`,
        [companyId, newsId, userId],
      );
    }

    this.logger.debug(
      `[OPEN] company=${companyId} news=${newsId} user=${userId} origin=${origin || 'n/a'}`,
    );
  }

  async markOpen(
    companyId: string,
    newsId: string,
    userId?: string,
    meta?: any,
  ) {
    return this.insertOpen(companyId, newsId, userId, meta);
  }

  async acknowledge(companyId: string, newsId: string, userId?: string) {
    return this.upsertAck(companyId, newsId, userId);
  }

  async react(
    companyId: string,
    newsId: string,
    userId: string | undefined,
    reactionIn: unknown,
  ) {
    await this.assertNews(companyId, newsId);
    const reaction = normalizeReaction(reactionIn);
    const existing = await this.reactions.findOne({
      where: { companyId, newsId, userId: userId || null },
    });
    if (existing) {
      (existing as any).reaction = reaction;
      return this.reactions.save(existing);
    }
    const row = this.reactions.create({
      companyId,
      newsId,
      userId: userId || null,
      reaction: reaction as any,
    });
    return this.reactions.save(row);
  }

  async unreact(companyId: string, newsId: string, userId: string) {
    await this.assertNews(companyId, newsId);
    await this.reactions.delete({ companyId, newsId, userId });
    return { ok: true };
  }

  async comment(
    companyId: string,
    newsId: string,
    userId: string | undefined,
    textIn: unknown,
    moderate: boolean,
  ) {
    await this.assertNews(companyId, newsId);
    const text = String(textIn ?? '').trim();
    if (!text) throw new BadRequestException('text is required');

    const row = this.comments.create({
      companyId,
      newsId,
      userId: userId || null,
      text,
      approved: !moderate,
      approvedAt: !moderate ? new Date() : null,
    });
    return this.comments.save(row);
  }

  async moderateComment(
    companyId: string,
    newsId: string,
    commentId: string,
    approve: boolean,
    adminId: string,
  ) {
    const row = await this.comments.findOne({
      where: { id: commentId, newsId, companyId },
    });
    if (!row) throw new ForbiddenException('Comment not found');
    row.approved = approve;
    (row as any).approvedBy = adminId;
    row.approvedAt = new Date();
    return this.comments.save(row);
  }

  async share(
    companyId: string,
    newsId: string,
    userId: string | undefined,
    channel: 'app' | 'external',
    meta?: any,
  ) {
    await this.assertNews(companyId, newsId);
    const row = this.shares.create({
      companyId,
      newsId,
      userId: userId || null,
      channel,
      meta,
    });
    return this.shares.save(row);
  }

  async favorite(companyId: string, newsId: string, userId: string) {
    await this.assertNews(companyId, newsId);
    const table = this.events.metadata.tableName || 'news_interaction_event';
    const params = [companyId, newsId, userId, 'FAVORITE'];

    // Registra evento de favorito (idempotente para não poluir se clicar várias vezes rapidamente, 
    // mas idealmente queremos saber quando favoritou. Como não tem unique constraint de favorite no events,
    // vai inserir sempre. Se quiser evitar flood, poderia checar antes, mas events são log.)
    await this.events.query(
      `INSERT INTO ${table} ("companyId","newsId","userId","type")
       VALUES ($1,$2,$3,$4)`,
      params,
    );

    this.logger.debug(`[FAVORITE] company=${companyId} news=${newsId} user=${userId}`);
  }
}
