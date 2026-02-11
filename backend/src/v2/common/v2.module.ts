// backend/src/v2/common/v2.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES base
import { NewsEntity } from 'src/news/news.entity';
import { Channel } from 'src/channels/channel.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { UserEntity } from 'src/users/user.entity';
import { CompanyEntity } from 'src/companies/company.entity';
import { GroupEntity } from 'src/groups/group.entity';
import { UserDeviceEntity } from 'src/notifications/entities/user-device.entity';

// ENTITIES v2 (interactions/audience)
import { InteractionEventEntity } from 'src/v2/interactions/entities/interaction-event.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';
import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';
import { NewsMetricsDailyEntity } from 'src/v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';
import { SearchMetricsDailyEntity } from 'src/v2/interactions/entities/search-metrics-daily.entity';
import { NewsFavoriteEntity } from 'src/v2/interactions/entities/news-favorite.entity';
import { SearchLogEntity } from 'src/search/search-log.entity';

// CONTROLLERS
import { NewsV2Controller } from 'src/v2/news/news.controller';
import { AnalyticsV2Controller } from 'src/v2/analytics/analytics.controller';
import { MeController } from 'src/v2/me/me.controller';
import { SpacesV2Controller } from 'src/v2/spaces/spaces.controller';
import { ChannelsV2Controller } from 'src/v2/channels/channels.controller';
import { SearchV2Controller } from 'src/v2/search/search.controller';
import { PushV2Controller } from 'src/v2/push/push.controller';
import { InteractionsControllerV2 } from 'src/v2/interactions/interactions.controller';
import { NewsCommentsControllerV2 } from 'src/v2/comments/news-comments.controller';
import { NewsPushControllerV2 } from 'src/v2/news/news-push.controller';
import { AudienceV2Controller } from 'src/v2/audience/audience.controller';
import { UserAnalyticsController } from 'src/v2/analytics/user-analytics.controller';

// SERVICES
import { NewsV2Service } from 'src/v2/news/news.service';
import { InteractionsService } from 'src/v2/interactions/interactions.service';
import { AnalyticsV2Service } from 'src/v2/analytics/analytics.service';
import { MeService } from 'src/v2/me/me.service';
import { SpacesV2Service } from 'src/v2/spaces/spaces.service';
import { ChannelsV2Service } from 'src/v2/channels/channels.service';
import { SearchV2Service } from 'src/v2/search/search.service';
import { PushV2Service } from 'src/v2/push/push.service';
import { FeedV2Service } from 'src/v2/feed/feed.service';
import { AudienceService } from 'src/v2/audience/audience.service';
import { LogicalAudienceService } from 'src/v2/audience/logical-audience.service';
import { UserAnalyticsService } from 'src/v2/analytics/user-analytics.service';

// ADD-ONS
import { SchemaIntrospectorV2 } from 'src/v2/common/schema-introspector.v2';
import { MetricsDailyServiceV2 } from 'src/v2/metrics/metrics-daily.service';
import { CommentCounterAdapterV2 } from 'src/v2/comments/comment-counter.adapter';

// NOTIF / PUSH
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PushDeliveryEntity } from 'src/v2/push/entities/push-delivery.entity';

// 🔗 para resolver audience
import { NewsModule } from 'src/news/news.module';

// PUSH NEWS (provider necessário pelo NewsPushControllerV2)
import { NewsPushServiceV2 } from 'src/v2/news/news-push.service';
import { NewsMetricsUsersServiceV2 } from '../news/news-metrics-users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // base
      NewsEntity,
      Channel,
      SpaceEntity,
      UserEntity,
      CompanyEntity,
      GroupEntity,
      UserDeviceEntity,

      // métricas e push
      NewsMetricsDailyEntity,
      UserMetricsDailyEntity,
      SearchMetricsDailyEntity,
      PushDeliveryEntity,

      // interactions
      InteractionEventEntity,
      NewsReactionEntity,
      NewsCommentEntity,
      NewsShareEntity,

      // audience
      NewsAudienceEntity,
      NewsFavoriteEntity,
      SearchLogEntity
    ]),
    NotificationsModule,
    forwardRef(() => NewsModule),
  ],
  controllers: [
    NewsV2Controller,
    AnalyticsV2Controller,

    MeController,
    SpacesV2Controller,
    ChannelsV2Controller,
    SearchV2Controller,
    PushV2Controller,
    InteractionsControllerV2,
    NewsCommentsControllerV2,
    NewsPushControllerV2,
    AudienceV2Controller,
    UserAnalyticsController,
  ],
  providers: [
    // core
    NewsV2Service,
    InteractionsService,
    AnalyticsV2Service,

    MeService,
    SpacesV2Service,
    ChannelsV2Service,
    SearchV2Service,
    PushV2Service,
    FeedV2Service,
    AudienceService,
    NewsMetricsUsersServiceV2,

    // add-ons
    SchemaIntrospectorV2,
    CommentCounterAdapterV2,
    MetricsDailyServiceV2,

    // push news (⚠️ ESSENCIAL para o NewsPushControllerV2)
    NewsPushServiceV2,
    LogicalAudienceService,
    UserAnalyticsService,
  ],
  exports: [
    TypeOrmModule,
    FeedV2Service,
    InteractionsService,
    AudienceService,
    LogicalAudienceService,
    SchemaIntrospectorV2,
    CommentCounterAdapterV2,
    MetricsDailyServiceV2,
    UserAnalyticsService,
    AnalyticsV2Service,
  ],
})
export class V2Module { }
