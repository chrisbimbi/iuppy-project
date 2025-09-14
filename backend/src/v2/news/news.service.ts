import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from 'src/news/news.entity';
import { InteractionsService } from '../interactions/interactions.service';
import { ReactionType } from './dto/react-news.dto';
import { V2ShareChannel } from './dto/share-news.dto';

@Injectable()
export class NewsV2Service {
  constructor(
    @InjectRepository(NewsEntity) private readonly news: Repository<NewsEntity>,
    private readonly interactions: InteractionsService,
  ) {}

  private async ensureNews(companyId: string, newsId: string): Promise<NewsEntity> {
    const n = await this.news.findOne({ where: { id: newsId } });
    if (!n || n.companyId !== companyId) {
      throw new ForbiddenException('News not accessible for this company');
    }
    return n;
  }

  async detail(companyId: string, id: string, userId: string) {
    const n = await this.ensureNews(companyId, id);
    const [snap, opened, ack, myReaction, myComments] = await Promise.all([
      this.interactions.snapshotForNews(companyId, id),
      this.interactions.hasOpened(companyId, id, userId),
      this.interactions.hasAck(companyId, id, userId),
      this.interactions.myReaction(companyId, id, userId),
      this.interactions.myCommentsCount(companyId, id, userId),
    ]);

    return {
      ...n,
      metrics: snap,
      userState: { opened, acknowledged: ack, myReaction, myComments },
    };
  }

  async open(companyId: string, newsId: string, userId: string, _meta?: Record<string, any>) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.markOpen(companyId, newsId, userId);
  }

  async ack(companyId: string, newsId: string, userId: string) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.acknowledge(companyId, newsId, userId);
  }

  async react(companyId: string, newsId: string, userId: string, reaction: ReactionType) {
    await this.ensureNews(companyId, newsId);
    return this.interactions.react(companyId, newsId, userId, reaction);
  }

  async comment(companyId: string, newsId: string, userId: string, text: string) {
    const n = await this.ensureNews(companyId, newsId);
    const settings: any = (n as any).settings ?? {};
    const moderateComments =
      (settings?.moderation?.comments ?? settings?.moderateComments ?? false) === true;
    return this.interactions.comment(companyId, newsId, userId, text, moderateComments);
  }

  async share(
    companyId: string,
    newsId: string,
    userId: string,
    channel: V2ShareChannel | undefined,
    meta?: Record<string, any>,
  ) {
    await this.ensureNews(companyId, newsId);
    const mapped: 'app' | 'external' = channel === 'app' ? 'app' : 'external';
    return this.interactions.share(companyId, newsId, userId, mapped, meta);
  }
}