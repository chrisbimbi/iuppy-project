// src/v2/common/v2.module.ts
import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// ENTITIES base
import { NewsEntity } from 'src/news/news.entity'
import { Channel } from 'src/channels/channel.entity'
import { SpaceEntity } from 'src/spaces/space.entity'
import { UserEntity } from 'src/users/user.entity'
import { CompanyEntity } from 'src/companies/company.entity'
import { GroupEntity } from 'src/groups/group.entity'
import { UserDeviceEntity } from 'src/notifications/entities/user-device.entity'

// ENTITIES v2 (interactions/audience)
import { InteractionEventEntity } from '../interactions/entities/interaction-event.entity'
import { NewsReactionEntity } from '../interactions/entities/news-reaction.entity'
import { NewsCommentEntity } from '../interactions/entities/news-comment.entity'
import { NewsShareEntity } from '../interactions/entities/news-share.entity'
import { NewsAudienceEntity } from '../interactions/entities/news-audience.entity'
import { NewsMetricsDailyEntity } from '../interactions/entities/news-metrics-daily.entity'
import { UserMetricsDailyEntity } from '../interactions/entities/user-metrics-daily.entity'
import { SearchMetricsDailyEntity } from '../interactions/entities/search-metrics-daily.entity'

// CONTROLLERS
import { NewsV2Controller } from '../news/news.controller'
import { AnalyticsV2Controller } from '../analytics/analytics.controller'
import { MeController } from '../me/me.controller'
import { SpacesV2Controller } from '../spaces/spaces.controller'
import { ChannelsV2Controller } from '../channels/channels.controller'
import { SearchV2Controller } from '../search/search.controller'
import { PushV2Controller } from '../push/push.controller'
import { InteractionsControllerV2 } from '../interactions/interactions.controller'
import { NewsCommentsControllerV2 } from '../comments/news-comments.controller'
import { NewsPushControllerV2 } from '../news/news-push.controller'
import { AudienceV2Controller } from '../audience/audience.controller'

// SERVICES
import { NewsV2Service } from '../news/news.service'
import { InteractionsService } from '../interactions/interactions.service'
import { AnalyticsV2Service } from '../analytics/analytics.service'
import { MeService } from '../me/me.service'
import { SpacesV2Service } from '../spaces/spaces.service'
import { ChannelsV2Service } from '../channels/channels.service'
import { SearchV2Service } from '../search/search.service'
import { PushV2Service } from '../push/push.service'
import { FeedV2Service } from '../feed/feed.service'
import { AudienceService } from '../audience/audience.service'

// ADD-ONS
import { SchemaIntrospectorV2 } from './schema-introspector.v2'
import { MetricsDailyServiceV2 } from '../metrics/metrics-daily.service'
import { CommentCounterAdapterV2 } from '../comments/comment-counter.adapter'

// PUSH NEWS (provider)
import { NewsPushServiceV2 } from '../news/news-push.service'

// NOTIFICATIONS (para CommunicationsService)
import { NotificationsModule } from 'src/notifications/notifications.module'
import { PushDeliveryEntity } from '../push/entities/push-delivery.entity'

// 🔗 para disponibilizar o AudienceResolverService no contexto do v2
import { NewsModule } from 'src/news/news.module'

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
    ]),
    NotificationsModule,
    // ⬇️ garante o provider AudienceResolverService para o AudienceService (v2)
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

    // add-ons
    SchemaIntrospectorV2,
    CommentCounterAdapterV2,
    MetricsDailyServiceV2,

    // push news
    NewsPushServiceV2,
  ],
  exports: [
    TypeOrmModule,
    FeedV2Service,
    InteractionsService,
    AudienceService,
    SchemaIntrospectorV2,
    CommentCounterAdapterV2,
    MetricsDailyServiceV2,
  ],
})
export class V2Module {}