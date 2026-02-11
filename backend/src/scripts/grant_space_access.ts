
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import 'reflect-metadata';

dotenv.config();

// IMPORT ALL ENTITIES
import { UserEntity } from '../users/user.entity';
import { Channel } from '../channels/channel.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { UserSpaceEntity } from '../spaces/user-space.entity';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { NewsEntity } from '../news/news.entity';
import { GroupEntity } from '../groups/group.entity';
import { SurveyEntity } from '../modules/surveys/entities/survey.entity';
import { SurveyQuestionEntity } from '../modules/surveys/entities/survey-question.entity';
import { SurveyResponseEntity } from '../modules/surveys/entities/survey-response.entity';
import { CompanyEntity } from '../companies/company.entity';
import { CompanySettingsEntity } from '../modules/company-settings/company-settings.entity';
import { CompanyModuleEntity } from '../modules/company-modules/company-module.entity';
import { ChatMessageEntity } from '../chat/entities/chat-message.entity';
import { ChatParticipantEntity } from '../chat/entities/chat-participant.entity';
import { ChatConversationEntity } from '../chat/entities/chat-conversation.entity';
import { VacationPolicyEntity } from '../modules/vacations/entities/vacation-policy.entity';
import { VacationBalanceEntity } from '../modules/vacations/entities/vacation-balance.entity';
import { VacationRequestEntity } from '../modules/vacations/entities/vacation-request.entity';
import { PerformanceCycleEntity } from '../modules/performance/entities/performance-cycle.entity';
import { AssessmentFormEntity } from '../modules/performance/entities/assessment-form.entity';
import { GoalEntity } from '../modules/performance/entities/goal.entity';
import { PDIEntity } from '../modules/performance/entities/pdi.entity';
import { PDIActionEntity } from '../modules/performance/entities/pdi-action.entity';
import { OneOnOneEntity } from '../modules/performance/entities/one-on-one.entity';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { NewsReactionEntity } from '../v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from '../v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from '../v2/interactions/entities/news-share.entity';
import { NewsMetricsDailyEntity } from '../v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from '../v2/interactions/entities/user-metrics-daily.entity';
import { NewsAudienceEntity } from '../v2/interactions/entities/news-audience.entity';
import { NewsFavoriteEntity } from '../v2/interactions/entities/news-favorite.entity';
import { NewsAcknowledgmentEntity } from '../news/entities/news-acknowledgment.entity';
import { SearchMetricsDailyEntity } from '../v2/interactions/entities/search-metrics-daily.entity';
import { PushDeliveryEntity } from '../v2/push/entities/push-delivery.entity';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { JourneyStepEntity } from '../modules/journeys/entities/journey-step.entity';
import { UserJourneyInstanceEntity } from '../modules/journeys/entities/user-journey-instance.entity';
import { StepCompletionEntity } from '../modules/journeys/entities/step-completion.entity';
import { ModuleAccessGrantEntity } from '../access-control/module-access-grant.entity';
import { UserXPHistoryEntity } from '../modules/gamification/entities/user-xp-history.entity';
import { BadgeEntity } from '../modules/gamification/entities/badge.entity';
import { UserBadgeEntity } from '../modules/gamification/entities/user-badge.entity';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { FormFieldEntity } from '../modules/forms/entities/form-field.entity';
import { FormSubmissionEntity } from '../modules/forms/entities/form-submission.entity';
import { FormSubmissionChatEntity } from '../modules/forms/entities/form-submission-chat.entity';
import { FormBadgeStateEntity } from '../modules/forms/entities/form-badge-state.entity';
import { IntegrationProvider } from '../modules/integrations/entities/integration_provider.entity';
import { IntegrationConnection } from '../modules/integrations/entities/integration_connection.entity';
import { IntegrationRun } from '../modules/integrations/entities/integration_run.entity';
import { IntegrationError } from '../modules/integrations/entities/integration_error.entity';
import { IdentityLink } from '../modules/integrations/entities/identity_link.entity';
import { DataLakeSnapshot } from '../modules/integrations/entities/data_lake_snapshot.entity';
import { Nr1RiskRecord } from '../modules/nr1/entities/nr1-risk-record.entity';
import { Nr1RiskCriteria } from '../modules/nr1/entities/nr1-risk-criteria.entity';
import { Nr1RiskType } from '../modules/nr1/entities/nr1-risk-type.entity';
import { Nr1ActionPlan } from '../modules/nr1/entities/nr1-action-plan.entity';
import { Nr1Training } from '../modules/nr1/entities/nr1-training.entity';
import { CompanyEsocialConfigEntity } from '../modules/nr1/entities/company-esocial-config.entity';

async function grantAccess() {
    console.log('🔌 Connecting to Port 5433 (Docker)...');
    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: 5433,
        username: process.env.DB_USERNAME || 'iuppy_admin',
        password: process.env.DB_PASSWORD || 'Iuppy#2025',
        database: process.env.DB_NAME || 'iuppy_dev',
        entities: [
            UserEntity, Channel, SpaceEntity, UserSpaceEntity, UserDeviceEntity, NewsEntity, GroupEntity,
            SurveyEntity, SurveyQuestionEntity, SurveyResponseEntity, CompanySettingsEntity, CompanyModuleEntity,
            CompanyEntity, ChatMessageEntity, ChatParticipantEntity, ChatConversationEntity,
            VacationPolicyEntity, VacationBalanceEntity, VacationRequestEntity,
            PerformanceCycleEntity, AssessmentFormEntity, GoalEntity, PDIEntity, PDIActionEntity, OneOnOneEntity,
            InteractionEventEntity, NewsReactionEntity, NewsCommentEntity, NewsShareEntity, NewsMetricsDailyEntity,
            UserMetricsDailyEntity, NewsAudienceEntity, NewsFavoriteEntity, NewsAcknowledgmentEntity,
            SearchMetricsDailyEntity, PushDeliveryEntity,
            JourneyEntity, JourneyStepEntity, UserJourneyInstanceEntity, StepCompletionEntity, ModuleAccessGrantEntity,
            UserXPHistoryEntity, BadgeEntity, UserBadgeEntity,
            FormEntity, FormFieldEntity, FormSubmissionEntity, FormSubmissionChatEntity, FormBadgeStateEntity,
            IntegrationProvider, IntegrationConnection, IntegrationRun, IntegrationError, IdentityLink, DataLakeSnapshot,
            Nr1RiskRecord, Nr1RiskCriteria, Nr1RiskType, Nr1ActionPlan, Nr1Training, CompanyEsocialConfigEntity
        ],
        synchronize: false,
    });

    try {
        await ds.initialize();
        console.log('✅ Connected.');

        const targetCompanyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
        const spaceRepo = ds.getRepository(SpaceEntity);
        const userRepo = ds.getRepository(UserEntity);
        const userSpaceRepo = ds.getRepository(UserSpaceEntity);

        let space = await spaceRepo.findOne({ where: { companyId: targetCompanyId, slug: 'geral-demo' } });
        if (!space) {
            console.error('❌ Space "Geral" (slug: geral-demo) not found in new company!');
            const anySpace = await spaceRepo.findOne({ where: { companyId: targetCompanyId } });
            if (anySpace) {
                console.log(`⚠️ Using fallback space: ${anySpace.name}`);
                space = anySpace; // Fixed assignment
            } else {
                console.log('❌ No Space found at all.');
                return;
            }
        }

        console.log(`Using Space: ${space!.name} (${space!.id})`);

        const emails = ['dev@iuppy.com.br', 'admin@iuppy.com.br', 'marketing@iuppy.com.br'];
        const users = await userRepo.createQueryBuilder('user')
            .where('user.email IN (:...emails)', { emails })
            .andWhere('user.companyId = :cid', { cid: targetCompanyId })
            .getMany();

        if (users.length === 0) {
            console.log('⚠️ No users found in this company to grant access.');
            return;
        }

        for (const user of users) {
            const existing = await userSpaceRepo.findOne({ where: { userId: user.id, spaceId: space!.id } });
            if (existing) {
                console.log(`✅ User ${user.email} already has access.`);
                continue;
            }

            await userSpaceRepo.save({
                userId: user.id,
                spaceId: space!.id,
                companyId: targetCompanyId,
                isAdmin: true,
                isMember: true,
                notificationsEnabled: true
            });
            console.log(`➕ Granted access to ${user.email}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await ds.destroy();
    }
}

grantAccess();
