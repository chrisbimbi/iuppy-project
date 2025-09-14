import { Injectable } from '@nestjs/common';
import { FeedService } from '../feed/feed.service';
import type { MeFeedQuery } from '@shared/types/v2/feed';

@Injectable()
export class MeService {
  constructor(private feed: FeedService) {}

  meFeed(companyId: string, userId: string, q: MeFeedQuery) {
    return this.feed.meFeed(companyId, userId, q);
  }
}