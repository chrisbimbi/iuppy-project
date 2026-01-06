// src/news/news.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NewsController } from './news.controller';
import { NewsAudienceController } from './news-audience.controller';

import { NewsEntity } from './news.entity';
import { CompanyEntity } from '../companies/company.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { Channel } from '../channels/channel.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';

import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { NewsAcknowledgmentEntity } from './entities/news-acknowledgment.entity';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { NewsFavoriteEntity } from '../v2/interactions/entities/news-favorite.entity';
import { PushDeliveryEntity } from '../v2/push/entities/push-delivery.entity';

import { UserDeviceEntity } from '../notifications/entities/user-device.entity';

import { NewsService } from './news.service';
import { AudienceResolverService } from './audience-resolver.service';

// 🔁 Importa o V2Module (que EXPORTA o AudienceService) para o controller poder injetá-lo
import { V2Module } from '../v2/common/v2.module';
import { CommunicationsService } from 'src/notifications/communications.service';
import { NewsUsersController } from './news-users.controller';
import { NewsMetricsService } from './news-metrics.service';
import { NewsAnalyticsService } from './news-analytics.service';
import { HashtagAnalyticsService } from './hashtag-analytics.service';
import { AccessControlModule } from 'src/access-control/access-control.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NewsEntity,
      UserDeviceEntity,
      CompanyEntity,
      SpaceEntity,
      Channel,
      GroupEntity,
      UserEntity,
      NewsAudienceEntity,
      NewsAcknowledgmentEntity,
      PushDeliveryEntity,
      InteractionEventEntity,
      NewsFavoriteEntity,
    ]),
    forwardRef(() => V2Module),
    AccessControlModule,
  ],
  controllers: [NewsController, NewsAudienceController, NewsUsersController],
  providers: [
    NewsService,
    AudienceResolverService,
    CommunicationsService,
    NewsMetricsService,
    NewsAnalyticsService,
    HashtagAnalyticsService,
  ],
  exports: [
    NewsService,
    AudienceResolverService,
    CommunicationsService,
    NewsMetricsService,
    NewsAnalyticsService,
    HashtagAnalyticsService,
  ],
})
export class NewsModule { }
