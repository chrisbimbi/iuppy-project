import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES (mantendo as suas)
import { NewsEntity } from 'src/news/news.entity';
import { Channel } from 'src/channels/channel.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { UserEntity } from 'src/users/user.entity';

import { InteractionEventEntity } from '../interactions/entities/interaction-event.entity';
import { NewsReactionEntity } from '../interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from '../interactions/entities/news-comment.entity';
import { NewsShareEntity } from '../interactions/entities/news-share.entity';

// CONTROLLERS (os seus)
import { NewsV2Controller } from '../news/news.controller';
import { AnalyticsV2Controller } from '../analytics/analytics.controller';
import { MeController } from '../me/me.controller';
import { SpacesV2Controller } from '../spaces/spaces.controller';
import { ChannelsV2Controller } from '../channels/channels.controller';
import { SearchV2Controller } from '../search/search.controller';
import { PushV2Controller } from '../push/push.controller';

// SERVICES (os seus)
import { NewsV2Service } from '../news/news.service';
import { InteractionsService } from '../interactions/interactions.service';
import { AnalyticsV2Service } from '../analytics/analytics.service';
import { MeService } from '../me/me.service';
import { SpacesV2Service } from '../spaces/spaces.service';
import { ChannelsV2Service } from '../channels/channels.service';
import { SearchV2Service } from '../search/search.service';
import { PushV2Service } from '../push/push.service';
import { FeedV2Service } from '../feed/feed.service';
import { AudienceService } from '../audience/audience.service';

@Module({
  // NADA de AuthModule aqui (o AppModule já importa AuthModule).
  imports: [
    TypeOrmModule.forFeature([
      NewsEntity,
      Channel,
      SpaceEntity,
      UserEntity,
      InteractionEventEntity,
      NewsReactionEntity,
      NewsCommentEntity,
      NewsShareEntity,
    ]),
  ],
  controllers: [
    NewsV2Controller,
    AnalyticsV2Controller,
    MeController,
    SpacesV2Controller,
    ChannelsV2Controller,
    SearchV2Controller,
    PushV2Controller,
  ],
  providers: [
    // IMPORTANTE: providers simples; ciclo é resolvido nos próprios services com @Inject(forwardRef())
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
  ],
  exports: [
    TypeOrmModule,
    // exporte só o que outra parte do app realmente usa
    FeedV2Service,
    InteractionsService,
    AudienceService,
  ],
})
export class V2Module {}