// backend/src/modules/forms/forms.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'
import { FormEntity } from './entities/form.entity'
import { FormFieldEntity } from './entities/form-field.entity'
import { FormSubmissionEntity } from './entities/form-submission.entity'
import { FormAnswerEntity } from './entities/form-answer.entity'
import { FormAttachmentEntity } from './entities/form-attachment.entity'
import { FormRhActionEntity } from './entities/form-rh-action.entity'
import { FormEventEntity } from './entities/form-event.entity'
import { FormMetricsDailyEntity } from './entities/form-metrics-daily.entity'
import { NotificationsModule } from 'src/notifications/notifications.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormEntity, FormFieldEntity, FormSubmissionEntity, FormAnswerEntity,
      FormAttachmentEntity, FormRhActionEntity, FormEventEntity, FormMetricsDailyEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [TypeOrmModule, FormsService],
})
export class FormsModule {}
