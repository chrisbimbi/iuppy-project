import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nr1RiskRecord } from './entities/nr1-risk-record.entity';
import { Nr1RiskCriteria } from './entities/nr1-risk-criteria.entity';
import { Nr1ActionPlan } from './entities/nr1-action-plan.entity';
import { Nr1RiskType } from './entities/nr1-risk-type.entity';
import { Nr1Version } from './entities/nr1-version.entity';

import { Nr1EmergencyProcedure } from './entities/nr1-emergency-procedure.entity';
import { Nr1EmergencyDrill } from './entities/nr1-emergency-drill.entity';
import { Nr1DrillAttendance } from './entities/nr1-drill-attendance.entity';

import { Nr1Training } from './entities/nr1-training.entity';
import { Nr1TrainingSession } from './entities/nr1-training-session.entity';
import { Nr1TrainingAttempt } from './entities/nr1-training-attempt.entity';
import { Nr1Certificate } from './entities/nr1-certificate.entity';

import { Nr1EvidenceFile } from './entities/nr1-evidence-file.entity';
import { Nr1EsocialQueue } from './entities/nr1-esocial-queue.entity';
import { Nr1EsocialResult } from './entities/nr1-esocial-result.entity';
import { CompanyEsocialConfigEntity } from './entities/company-esocial-config.entity';

import { Nr1RisksController } from './controllers/nr1-risks.controller';
import { Nr1ActionPlansController } from './controllers/nr1-action-plans.controller';
import { Nr1ParticipationController } from './controllers/nr1-participation.controller';
import { Nr1EmergencyController } from './controllers/nr1-emergency.controller';
import { Nr1TrainingsController } from './controllers/nr1-trainings.controller';
import { EvidenceVaultController } from './controllers/evidence-vault.controller';
import { Nr1EsocialController } from './controllers/nr1-esocial.controller';
import { Nr1AnalyticsController } from './controllers/nr1-analytics.controller';
import { Nr1RiskTypesController } from './controllers/nr1-risk-types.controller';
import { Nr1EsocialConfigController } from './controllers/nr1-esocial-config.controller';

import { Nr1RisksService } from './services/nr1-risks.service';
import { Nr1ActionPlansService } from './services/nr1-action-plans.service';
import { Nr1ParticipationService } from './services/nr1-participation.service';
import { Nr1EmergencyService } from './services/nr1-emergency.service';
import { Nr1TrainingsService } from './services/nr1-trainings.service';
import { EvidenceVaultService } from './services/evidence-vault.service';
import { Nr1EsocialService } from './services/nr1-esocial.service';
import { Nr1AnalyticsService } from './services/nr1-analytics.service';
import { Nr1RiskTypesService } from './services/nr1-risk-types.service';
import { Nr1EsocialConfigService } from './services/nr1-esocial-config.service';

import { FormEntity } from '../forms/entities/form.entity';
import { FormSubmissionEntity } from '../forms/entities/form-submission.entity';
import { NewsEntity } from '../../news/news.entity';
import { JourneyEntity } from '../journeys/entities/journey.entity';
import { UserJourneyInstanceEntity } from '../journeys/entities/user-journey-instance.entity';
import { StepCompletionEntity } from '../journeys/entities/step-completion.entity';
import { UploadsModule } from '../../uploads/uploads.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { CertificateOcrService } from './services/certificate-ocr.service';

@Module({
    imports: [
        NotificationsModule,
        UploadsModule,
        TypeOrmModule.forFeature([
            Nr1RiskRecord,
            Nr1RiskCriteria,
            Nr1ActionPlan,
            Nr1RiskType,
            Nr1Version,
            Nr1EmergencyProcedure,
            Nr1EmergencyDrill,
            Nr1DrillAttendance,
            Nr1Training,
            Nr1TrainingSession,
            Nr1TrainingAttempt,
            Nr1Certificate,
            Nr1EvidenceFile,
            Nr1EsocialQueue,
            Nr1EsocialResult,
            CompanyEsocialConfigEntity,
            FormEntity,
            FormSubmissionEntity,
            NewsEntity,
            JourneyEntity,
            UserJourneyInstanceEntity,
            StepCompletionEntity,
        ]),
    ],
    controllers: [
        Nr1RisksController,
        Nr1ActionPlansController,
        Nr1ParticipationController,
        Nr1EmergencyController,
        Nr1TrainingsController,
        EvidenceVaultController,
        Nr1EsocialController,
        Nr1AnalyticsController,
        Nr1RiskTypesController,
        Nr1EsocialConfigController,
    ],
    providers: [
        Nr1RisksService,
        Nr1ActionPlansService,
        Nr1ParticipationService,
        Nr1EmergencyService,
        Nr1TrainingsService,
        EvidenceVaultService,
        Nr1EsocialService,
        Nr1AnalyticsService,
        Nr1RiskTypesService,
        Nr1EsocialConfigService,
        CertificateOcrService,
    ],
    exports: [
        Nr1RisksService,
        Nr1ActionPlansService,
        Nr1ParticipationService,
        Nr1EmergencyService,
        Nr1TrainingsService,
        EvidenceVaultService,
        Nr1EsocialService,
        Nr1AnalyticsService,
        CertificateOcrService
    ],
})
export class Nr1Module { }
