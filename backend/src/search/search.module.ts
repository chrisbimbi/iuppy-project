import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { NewsModule } from '../news/news.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsEntity } from '../news/news.entity';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { SurveyEntity } from '../modules/surveys/entities/survey.entity';

import { SearchLogEntity } from './search-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            NewsEntity,
            SearchLogEntity,
            JourneyEntity,
            FormEntity,
            SurveyEntity
        ]),
        NewsModule,
        // Add other modules here
    ],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule { }
