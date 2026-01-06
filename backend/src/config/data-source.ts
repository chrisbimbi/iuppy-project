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
import { ChatMessageEntity } from 'src/chat/entities/chat-message.entity';
import { ChatParticipantEntity } from 'src/chat/entities/chat-participant.entity';
import { ChatConversationEntity } from 'src/chat/entities/chat-conversation.entity';

// **** Vacation & Performance
import { VacationPolicyEntity } from '../modules/vacations/entities/vacation-policy.entity';
import { VacationBalanceEntity } from '../modules/vacations/entities/vacation-balance.entity';
import { VacationRequestEntity } from '../modules/vacations/entities/vacation-request.entity';
import { PerformanceCycleEntity } from '../modules/performance/entities/performance-cycle.entity';
import { AssessmentFormEntity } from '../modules/performance/entities/assessment-form.entity';
import { GoalEntity } from '../modules/performance/entities/goal.entity';
import { PDIEntity } from '../modules/performance/entities/pdi.entity';
import { PDIActionEntity } from '../modules/performance/entities/pdi-action.entity';
import { OneOnOneEntity } from '../modules/performance/entities/one-on-one.entity';


// **** novos entities usados pelo AnalyticsV2Service
import { InteractionEventEntity } from 'src/v2/interactions/entities/interaction-event.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';
import { NewsMetricsDailyEntity } from 'src/v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';
import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';
import { NewsFavoriteEntity } from 'src/v2/interactions/entities/news-favorite.entity';
import { NewsAcknowledgmentEntity } from 'src/news/entities/news-acknowledgment.entity';
import { SearchMetricsDailyEntity } from 'src/v2/interactions/entities/search-metrics-daily.entity';
import { PushDeliveryEntity } from 'src/v2/push/entities/push-delivery.entity';

// **** Journeys Module
import { JourneyEntity } from 'src/modules/journeys/entities/journey.entity';
import { JourneyStepEntity } from 'src/modules/journeys/entities/journey-step.entity';
import { UserJourneyInstanceEntity } from 'src/modules/journeys/entities/user-journey-instance.entity';
import { StepCompletionEntity } from 'src/modules/journeys/entities/step-completion.entity';
import { ModuleAccessGrantEntity } from 'src/access-control/module-access-grant.entity';
// **** Integrations
import { IntegrationProvider } from '../modules/integrations/entities/integration_provider.entity';
import { IntegrationConnection } from '../modules/integrations/entities/integration_connection.entity';
import { IntegrationRun } from '../modules/integrations/entities/integration_run.entity';
import { IntegrationError } from '../modules/integrations/entities/integration_error.entity';
import { IdentityLink } from '../modules/integrations/entities/identity_link.entity';
import { DataLakeSnapshot } from '../modules/integrations/entities/data_lake_snapshot.entity';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

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

    // **** Integrations
    IntegrationProvider,
    IntegrationConnection,
    IntegrationRun,
    IntegrationError,
    IdentityLink,
    DataLakeSnapshot,

    // **** adicionados
    InteractionEventEntity,
    NewsReactionEntity,
    NewsCommentEntity,
    NewsShareEntity,
    NewsMetricsDailyEntity,
    UserMetricsDailyEntity,
    NewsAudienceEntity,
    NewsAudienceEntity,
    NewsFavoriteEntity,
    NewsAcknowledgmentEntity,
    SearchMetricsDailyEntity,
    SearchMetricsDailyEntity,
    PushDeliveryEntity,

    // **** Chat
    ChatConversationEntity,
    ChatParticipantEntity,
    ChatMessageEntity,

    // **** Journeys
    JourneyEntity,
    JourneyStepEntity,
    UserJourneyInstanceEntity,
    StepCompletionEntity,
    ModuleAccessGrantEntity,

    // **** Vacations
    VacationPolicyEntity,
    VacationBalanceEntity,
    VacationRequestEntity,

    // **** Performance
    PerformanceCycleEntity,
    AssessmentFormEntity,
    GoalEntity,
    PDIEntity,
    PDIActionEntity,
    OneOnOneEntity,

  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // <<< DESLIGADO
});
