import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialPostEntity } from './entities/social-post.entity';
import { SocialCommentEntity } from './entities/social-comment.entity';
import { SocialReactionEntity } from './entities/social-reaction.entity';
import { SocialInteractionEventEntity } from './entities/social-interaction-event.entity';
import { SocialAnalyticsService } from './social-analytics.service';
import { SocialAnalyticsController } from './social-analytics.controller';
import { Channel } from '../../channels/channel.entity';
import { SentimentService } from './services/sentiment.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SocialPostEntity,
            SocialCommentEntity,
            SocialReactionEntity,
            SocialInteractionEventEntity,
            Channel,
        ]),
    ],
    controllers: [SocialController, SocialAnalyticsController],
    providers: [SocialService, SocialAnalyticsService, SentimentService],
    exports: [SocialService, SentimentService, SocialAnalyticsService],

})
export class SocialModule { }
