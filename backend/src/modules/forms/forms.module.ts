// src/forms/forms.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { FormsController } from './forms.controller';
import { FormsEventsController } from './forms-events.controller';
import { PublicFormsController } from './public-forms.controller';
import { FormsAnalyticsController } from './analytics/forms-analytics.controller';
import { FormsRemindersController } from './reminders/forms-reminders.controller';

// Services
import { FormsService } from './forms.service';
import { FormsEventsService } from './forms-events.service';
import { FormsAnalyticsService } from './analytics/forms-analytics.service';
import { FormsRemindersService } from './reminders/forms-reminders.service';

// Guards
import { FormsAclGuard } from './guards/forms-acl.guard';

// Crons
import { FormsAnalyticsCron } from './analytics/forms-analytics.cron';
import { FormsRemindersCron } from './reminders/forms-reminders.cron';

// Entities
import { FormEntity } from './entities/form.entity';
import { FormFieldEntity } from './entities/form-field.entity';
import { FormSubmissionEntity } from './entities/form-submission.entity';
import { FormAnswerEntity } from './entities/form-answer.entity';
import { FormAttachmentEntity } from './entities/form-attachment.entity';
import { FormRhActionEntity } from './entities/form-rh-action.entity';
import { FormEventEntity } from './entities/form-event.entity';
import { FormMetricsDailyEntity } from './entities/form-metrics-daily.entity';
import { FormNotificationSettingEntity } from './entities/form-notification-setting.entity';
import { FormBadgeStateEntity } from './entities/form-badge-state.entity';
import { ReminderEventEntity } from './entities/reminder-event.entity';
import { NotificationEventEntity } from './entities/notification-event.entity';
// 🔥 S3+: Importa a nova entity
import { FormSubmissionChatEntity } from './entities/form-submission-chat.entity';

// ==================================
// CORREÇÃO: Importar a nova entidade de Log
// ==================================
import { FormAuditLogEntity } from './entities/form_audit_log.entity';

// Dependências
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormEntity,
      FormFieldEntity,
      FormSubmissionEntity,
      FormAnswerEntity,
      FormAttachmentEntity,
      FormRhActionEntity,
      FormNotificationSettingEntity,
      FormEventEntity,
      FormMetricsDailyEntity,
      FormBadgeStateEntity,
      ReminderEventEntity,
      NotificationEventEntity,
      FormSubmissionChatEntity, // <-- S3+: Registrada
      // ==================================
      // CORREÇÃO: Registrar a entidade de Log
      // ==================================
      FormAuditLogEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [
    FormsController,
    FormsEventsController,
    PublicFormsController,
    FormsAnalyticsController,
    FormsRemindersController,
  ],
  providers: [
    // Services
    FormsService,
    FormsEventsService,
    FormsAnalyticsService,
    FormsRemindersService,

    // Guards
    FormsAclGuard,

    // Crons
    FormsRemindersCron,
    FormsAnalyticsCron,
  ],
  exports: [
    TypeOrmModule,
    FormsService,
    FormsAnalyticsService,
    FormsRemindersService,
  ],
})
export class FormsModule {}