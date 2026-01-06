import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceCycleEntity } from './entities/performance-cycle.entity';
import { AssessmentFormEntity } from './entities/assessment-form.entity';
import { AssessmentAnswerEntity } from './entities/assessment-answer.entity';
import { CompetenceEntity } from './entities/competence.entity';
import { GoalEntity } from './entities/goal.entity';
import { KeyResultEntity } from './entities/key-result.entity';
import { PDIEntity } from './entities/pdi.entity';
import { PDIActionEntity } from './entities/pdi-action.entity';
import { OneOnOneEntity } from './entities/one-on-one.entity';
import { PerformanceController } from './performance.controller';
import { PerformanceAnalyticsController } from './performance-analytics.controller';
import { PerformanceService } from './performance.service';

import { NotificationsModule } from '../../notifications/notifications.module';

import { OneOnOneController } from './one-on-one.controller';

import { FlightRiskService } from './services/flight-risk.service';
import { LlmToolsService } from './services/llm-tools.service';

@Module({
    imports: [
        NotificationsModule,
        TypeOrmModule.forFeature([
            PerformanceCycleEntity,
            AssessmentFormEntity,
            AssessmentAnswerEntity,
            CompetenceEntity,
            GoalEntity,
            KeyResultEntity,
            PDIEntity,
            PDIActionEntity,
            OneOnOneEntity,
        ]),
    ],
    controllers: [PerformanceController, PerformanceAnalyticsController, OneOnOneController],
    providers: [PerformanceService, FlightRiskService, LlmToolsService],
    exports: [PerformanceService, FlightRiskService, LlmToolsService],
})
export class PerformanceModule { }
