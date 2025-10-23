import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'reflect-metadata';

import { UserEntity } from '../users/user.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { NewsEntity } from '../news/news.entity';
import { GroupEntity } from 'src/groups/group.entity';
import { SurveyEntity } from 'src/modules/surveys/entities/survey.entity';
import { SurveyQuestionEntity } from 'src/modules/surveys/entities/survey-question.entity';
import { SurveyResponseEntity } from 'src/modules/surveys/entities/survey-response.entity';
import { CompanyEntity } from '../companies/company.entity';
import { CompanySettingsEntity } from 'src/modules/company-settings/company-settings.entity';
import { CompanyModuleEntity } from 'src/modules/company-modules/company-module.entity';

// **** novos entities usados pelo AnalyticsV2Service
import { InteractionEventEntity } from 'src/v2/interactions/entities/interaction-event.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';
import { NewsMetricsDailyEntity } from 'src/v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';
import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';
import { SearchMetricsDailyEntity } from 'src/v2/interactions/entities/search-metrics-daily.entity';
import { PushDeliveryEntity } from 'src/v2/push/entities/push-delivery.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    UserEntity,
    Channel,
    SpaceEntity,
    NewsEntity,
    GroupEntity,
    SurveyEntity,
    SurveyQuestionEntity,
    SurveyResponseEntity,
    CompanySettingsEntity,
    CompanyModuleEntity,
    CompanyEntity,

    // **** adicionados
    InteractionEventEntity,
    NewsReactionEntity,
    NewsCommentEntity,
    NewsShareEntity,
    NewsMetricsDailyEntity,
    UserMetricsDailyEntity,
    NewsAudienceEntity,
    SearchMetricsDailyEntity,
    PushDeliveryEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,   // <<< DESLIGADO
});