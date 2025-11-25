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

  // ==================================
  // 🔥 NOVO: HTML Builder (Enterprise Style)
  // ==================================
  private generateHtml(formTitle: string, submissionId: string, formId: string): string {
    // Ajuste para a URL real do seu ambiente de admin
    const adminUrl = `https://admin.iuppy.com/forms/${formId}/submissions`; 
    
    return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#F3F4F6;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding:40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:32px;background:#1E1E2D;color:#ffffff;text-align:center;">
                  <h2 style="margin:0;font-size:24px;font-weight:600;">Nova Submissão Recebida</h2>
                  <p style="margin:8px 0 0;opacity:0.8;font-size:16px;">${formTitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;text-align:center;">
                  <p style="margin-bottom:24px;font-size:16px;color:#4B5563;line-height:1.5;">
                    Um colaborador acabou de enviar uma resposta para este formulário.
                    <br>Acesse o painel para revisar os detalhes e anexos.
                  </p>
                  <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;">
                     <p style="margin:0;font-size:14px;color:#6B7280;">ID da Submissão:</p>
                     <p style="margin:4px 0 0;font-family:monospace;font-size:14px;color:#1F2937;">${submissionId}</p>
                  </div>
                  <a href="${adminUrl}" style="display:inline-block;background:#3E97FF;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px;">
                    Ver no Painel
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;background:#F9FAFB;text-align:center;color:#9CA3AF;font-size:12px;">
                  Enviado automaticamente pela iuppy Forms
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  async sendNewSubmissionEmail(params: {
    to: string[];
    form: FormEntity;
    submission: FormSubmissionEntity;
  }): Promise<void> {
    if (!params.to || !params.to.length) return;
    
    // Pega o título em PT-BR ou fallback
    const title = (params.form.title as any)['pt-BR'] || 'Formulário';

    const html = this.generateHtml(title, params.submission.id, params.form.id);

    this.logger.log(
      `sendNewSubmissionEmail -> to=${params.to.join(', ')} form=${title} submission=${params.submission.id}`,
    );

    // AQUI: Chame seu provider de email real (Sendgrid/SES) passando o 'html'.
    // Exemplo fictício:
    // await this.emailProvider.send({ to: params.to, subject: `Nova resposta: ${title}`, html });
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