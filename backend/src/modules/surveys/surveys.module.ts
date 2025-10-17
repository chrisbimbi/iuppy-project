// backend/src/modules/surveys/surveys.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { SurveyEntity } from './entities/survey.entity';
import { SurveyQuestionEntity } from './entities/survey-question.entity';
import { SurveyResponseEntity } from './entities/survey-response.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([SurveyEntity, SurveyQuestionEntity, SurveyResponseEntity]),
    ],
    providers: [SurveysService],
    controllers: [SurveysController],
    exports: [SurveysService],
})
export class SurveysModule { }