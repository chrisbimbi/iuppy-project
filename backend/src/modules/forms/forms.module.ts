// src/modules/forms/forms.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

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

import { NotificationsModule } from 'src/notifications/notifications.module';
import { FormsEventsService } from './forms-events.service';
import { FormsEventsController } from './forms-events.controller';
import { FormsRemindersService } from './reminders/forms-reminders.service';
import { FormsRemindersCron } from './reminders/forms-reminders.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormEntity,
      FormFieldEntity,
      FormSubmissionEntity,
      FormAnswerEntity,
      FormAttachmentEntity,
      FormRhActionEntity,
      FormEventEntity,
      FormMetricsDailyEntity,
      FormNotificationSettingEntity,
      FormBadgeStateEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [
    FormsController,
    FormsEventsController,
  ],
  providers: [
    FormsService,
    FormsEventsService,
    FormsRemindersService,
    FormsRemindersCron, // ⬅️ cron habilitado
  ],
  exports: [
    TypeOrmModule,
    FormsService,
    FormsRemindersService,
  ],
})
export class FormsModule {}
