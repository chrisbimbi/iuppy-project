// backend/src/modules/surveys/surveys.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { SurveyEntity } from './entities/survey.entity';
import { SurveyQuestionEntity } from './entities/survey-question.entity';
import { SurveyResponseEntity } from './entities/survey-response.entity';

// 🔥 IMPORT DO MÓDULO DE NOTIFICAÇÕES
// (Verifique se o nome da classe é NotificationsModule ou CommunicationsModule no seu projeto)
import { NotificationsModule } from '../../notifications/notifications.module';
import { AccessControlModule } from 'src/access-control/access-control.module';
import { ClusteringService } from './services/clustering.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyEntity,
      SurveyQuestionEntity,
      SurveyResponseEntity,
    ]),
    NotificationsModule, // <--- ADICIONADO: Agora o service tem acesso ao CommunicationsService
    AccessControlModule,
  ],
  providers: [SurveysService, ClusteringService],
  controllers: [SurveysController],
  exports: [SurveysService, ClusteringService],
})
export class SurveysModule { }
