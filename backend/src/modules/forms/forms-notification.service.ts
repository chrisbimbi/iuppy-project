// src/modules/forms/forms-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FormEntity } from './entities/form.entity';
import { FormSubmissionEntity } from './entities/form-submission.entity';
import { FormRhActionEntity } from './entities/form-rh-action.entity';

// <<< ESTE É O CONTRATO QUE O SERVICE VAI INJETAR >>>
export interface FormsNotificationPort {
  sendNewSubmissionEmail(params: {
    to: string[];
    form: FormEntity;
    submission: FormSubmissionEntity;
  }): Promise<void>;

  sendRhReplyPush(params: {
    toUserId?: string | null;
    toEmail?: string | null;
    form: FormEntity;
    action: FormRhActionEntity;
  }): Promise<void>;
}

@Injectable()
export class FormsNotificationService implements FormsNotificationPort {
  private readonly logger = new Logger(FormsNotificationService.name);

  async sendNewSubmissionEmail(params: {
    to: string[];
    form: FormEntity;
    submission: FormSubmissionEntity;
  }): Promise<void> {
    if (!params.to || !params.to.length) return;
    // aqui você pluga SES / Sendgrid / teu serviço interno
    this.logger.log(
      `sendNewSubmissionEmail -> to=${params.to.join(', ')} form=${params.form.title} submission=${params.submission.id}`,
    );
  }

  async sendRhReplyPush(params: {
    toUserId?: string | null;
    toEmail?: string | null;
    form: FormEntity;
    action: FormRhActionEntity;
  }): Promise<void> {
    if (params.toUserId) {
      this.logger.log(
        `sendRhReplyPush -> user=${params.toUserId} form=${params.form.title} action=${params.action.type}`,
      );
    }
    if (params.toEmail) {
      this.logger.log(
        `sendRhReplyEmail -> email=${params.toEmail} form=${params.form.title} action=${params.action.type}`,
      );
    }
  }
}
