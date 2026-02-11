import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../users/user.entity';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { UserXPHistoryEntity } from './entities/user-xp-history.entity';
import { UsersModule } from '../../users/users.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { GamificationListener } from './listeners/gamification.listener';

import { GamificationSettingsEntity } from './entities/gamification-settings.entity';
import { GamificationSettingsService } from './gamification-settings.service';
import { GamificationAnalyticsService } from './gamification-analytics.service';
import { BadgeEntity } from './entities/badge.entity';
import { UserBadgeEntity } from './entities/user-badge.entity';
import { GamificationExplanationEntity } from './entities/gamification-explanation.entity';

// External Entities for Overrides lookup (Corrected Paths)
import { NewsEntity } from '../../news/news.entity';
import { JourneyEntity } from '../journeys/entities/journey.entity';
import { JourneyStepEntity } from '../journeys/entities/journey-step.entity';
import { SurveyEntity } from '../surveys/entities/survey.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserXPHistoryEntity,
            UserEntity,
            BadgeEntity,
            UserBadgeEntity,
            GamificationSettingsEntity,
            GamificationExplanationEntity,
            NewsEntity,
            JourneyEntity,
            JourneyStepEntity,
            SurveyEntity,
        ]),
        NotificationsModule,
    ],
    providers: [GamificationService, GamificationListener, GamificationSettingsService, GamificationAnalyticsService],
    controllers: [GamificationController],
    exports: [GamificationService, GamificationSettingsService, GamificationAnalyticsService],

})
export class GamificationModule { }
