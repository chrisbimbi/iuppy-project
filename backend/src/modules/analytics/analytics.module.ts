import { Module } from '@nestjs/common';
import { DashboardStatsController } from './dashboard-stats.controller';
import { CompanyModulesModule } from '../company-modules/company-modules.module';
import { UsersModule } from '../../users/users.module';
import { SocialModule } from '../social/social.module';
import { Nr1Module } from '../nr1/nr1.module';
import { FormsModule } from '../forms/forms.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NewsModule } from '../../news/news.module';
import { VacationsModule } from '../vacations/vacations.module';
import { PerformanceModule } from '../performance/performance.module';
import { JourneysModule } from '../journeys/journeys.module';
import { V2Module } from '../../v2/common/v2.module';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
    imports: [
        CompanyModulesModule,
        UsersModule,
        SocialModule,
        Nr1Module,
        FormsModule,
        SurveysModule,
        GamificationModule,
        NewsModule,
        VacationsModule,
        PerformanceModule,
        JourneysModule,
        V2Module,
    ],
    controllers: [DashboardStatsController],
})
export class AnalyticsModule { }
