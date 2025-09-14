import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NewsEntity } from 'src/news/news.entity';
import { Channel } from 'src/channels/channel.entity';
import { AudienceService } from '../audience/audience.service';
import { InteractionsService } from '../interactions/interactions.service';
import type { MeFeedQuery, MeFeedItem, MeFeedResponse } from '@shared/types/v2/feed';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(NewsEntity) private newsRepo: Repository<NewsEntity>,
    @InjectRepository(Channel) private channels: Repository<Channel>,
    private audience: AudienceService,
    private interactions: InteractionsService,
  ) {}

  private async visibleNewsForUser(companyId: string, userId: string, q: MeFeedQuery) {
    // 1) carrega últimas publicadas
    const take = Math.min(q.limit ?? 20, 50);
    const where: any = { isPublished: true };
    if (q.channelId) where.channelId = q.channelId;

    if (q.cursor) where.createdAt = LessThan(new Date(q.cursor));

    const rows = await this.newsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take,
    });

    if (!rows.length) return { items: [], nextCursor: undefined };

    // 2) filtra por segmentação (space/channel/groups)
    const filtered: NewsEntity[] = [];
    for (const n of rows) {
      const ch = await this.channels.findOne({ where: { id: n.channelId, companyId } });
      const scope = { spaceIds: ch?.spaceIds || [] };
      const probe = await this.audience.probe({ companyId, scope });
      if (probe.userIds.includes(userId)) filtered.push(n);
    }

    const nextCursor = filtered.length ? filtered[filtered.length - 1].createdAt.toISOString() : undefined;
    return { items: filtered, nextCursor };
  }

  private async counters(companyId: string, userId: string, items: NewsEntity[]) {
    // Unread = publicadas e elegíveis - já abertas
    const bySpace: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    let totalUnread = 0;

    // agrupa por channelId pra reduzir calls
    const byChannelId = new Map<string, NewsEntity[]>();
    for (const n of items) {
      const arr = byChannelId.get(n.channelId) || [];
      arr.push(n);
      byChannelId.set(n.channelId, arr);
    }

    for (const [channelId, list] of byChannelId.entries()) {
      const ch = await this.channels.findOne({ where: { id: channelId, companyId } });
      const sids = ch?.spaceIds || [];
      for (const n of list) {
        const opened = await this.interactions.hasOpened(companyId, n.id, userId);
        if (!opened) {
          totalUnread += 1;
          byChannel[channelId] = (byChannel[channelId] || 0) + 1;
          for (const sid of sids) bySpace[sid] = (bySpace[sid] || 0) + 1;
        }
      }
    }

    return { totalUnread, bySpace, byChannel };
  }

  async meFeed(companyId: string, userId: string, q: MeFeedQuery): Promise<MeFeedResponse> {
    const { items: rows, nextCursor } = await this.visibleNewsForUser(companyId, userId, q);

    // monta itens + estado do usuário
    const items: MeFeedItem[] = [];
    for (const n of rows) {
      const [opened, ack, myReact, myComments] = await Promise.all([
        this.interactions.hasOpened(companyId, n.id, userId),
        this.interactions.hasAck(companyId, n.id, userId),
        this.interactions.myReaction(companyId, n.id, userId),
        this.interactions.myCommentsCount(companyId, n.id, userId),
      ]);

      items.push({
        id: n.id,
        title: n.title,
        subtitle: n.subtitle || undefined,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
        channelId: n.channelId,
        spaceIds: [], // preenchido pelo client com cache de canais → evitar requisição extra
        isPublished: n.isPublished,
        highlightImages: Array.isArray(n.highlightImages) ? n.highlightImages : undefined,
        userState: { opened, acknowledged: ack, myReaction: myReact, myComments },
      });
    }

    const counters = await this.counters(companyId, userId, rows);
    return { items, nextCursor, counters };
  }
}