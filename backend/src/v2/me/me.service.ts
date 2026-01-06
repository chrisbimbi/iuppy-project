import { Injectable } from '@nestjs/common';
import { FeedV2Service } from '../feed/feed.service';
import { MeFeedQuery } from './dto/me-feed.dto';

@Injectable()
export class MeService {
  constructor(private readonly feed: FeedV2Service) {}

  meFeed(companyId: string, userId: string, q: MeFeedQuery) {
    // delega para o FeedV2Service (getFeed)
    return this.feed.getFeed(companyId, userId, {
      limit: q?.limit,
      cursor: q?.cursor,
      spaceId: q?.spaceId,
      channelId: q?.channelId,
    });
  }
}
