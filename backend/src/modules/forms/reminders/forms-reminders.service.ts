import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommunicationsService } from 'src/notifications/communications.service';

@Injectable()
export class FormsRemindersService {
  private readonly log = new Logger(FormsRemindersService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly comms: CommunicationsService,
  ) {}

  private async findCompanyTimezone(companyId: string): Promise<string | null> {
    try {
      const rows = await this.ds.query(
        `
        SELECT (settings->>'timezone') AS tz
          FROM company_settings
         WHERE "companyId" = $1
         LIMIT 1
        `,
        [companyId],
      );
      const tz = rows?.[0]?.tz;
      if (tz) return tz;
    } catch {}
    return process.env.DEFAULT_TZ || 'UTC';
  }

  private computeReminderDatetime(deadline: Date, offsetDays: number, _tz: string): Date {
    const base = new Date(deadline);
    base.setUTCDate(base.getUTCDate() + offsetDays);
    base.setUTCHours(21, 0, 0, 0); // 21:00 no “dia do lembrete”
    return base;
  }

  async runForCompany(companyId: string) {
    const forms = await this.ds.query(
      `
      SELECT
        id,
        title,
        "deadlineAt",
        "remindersConfig"
      FROM form
      WHERE "companyId" = $1
        AND status = 'published'
        AND "deadlineAt" IS NOT NULL
      `,
      [companyId],
    );

    const now = new Date();
    const tz = await this.findCompanyTimezone(companyId);

    for (const f of forms) {
      const deadline = f.deadlineAt ? new Date(f.deadlineAt) : null;
      if (!deadline) continue;

      const cfg = f.remindersConfig ?? {};
      const offsets: string[] = Array.isArray(cfg.offsets) ? cfg.offsets : [];

      for (const offset of offsets) {
        const num = Number(offset);
        if (Number.isNaN(num)) continue;

        const reminderAt = this.computeReminderDatetime(deadline, num, tz);

        if (reminderAt.getTime() > now.getTime() + 5 * 60 * 1000) {
          continue;
        }

        const exists = await this.ds.query(
          `
          SELECT 1
          FROM reminder_event
          WHERE "companyId" = $1
            AND "formId" = $2
            AND kind = $3
            AND type = 'sent'
            AND ts = $4
          LIMIT 1
          `,
          [companyId, f.id, `D${num}`, reminderAt.toISOString()],
        );
        if (exists?.length) continue;

        await this.ds.query(
          `
          INSERT INTO reminder_event
            ("companyId","formId","kind","type","userId","externalEmail","meta","ts")
          VALUES
            ($1,$2,$3,'sent',NULL,NULL,jsonb_build_object('reason','deadline','offset',$4),$5)
          `,
          [companyId, f.id, `D${num}`, num, reminderAt.toISOString()],
        );

        await this.sendReminderEmails(companyId, f.id, f.title, deadline);

        this.log.log(`forms: reminder sent for form ${f.id} at ${reminderAt.toISOString()} (company=${companyId})`);
      }
    }

    return { ok: true, count: forms.length };
  }

  private async sendReminderEmails(
    companyId: string,
    formId: string,
    formTitle: string,
    deadlineAt: Date | null,
  ) {
    const rows = await this.ds.query(
      `
      SELECT "spaceId", emails
        FROM form_notification_setting
       WHERE "companyId" = $1
         AND "formId" = $2
      `,
      [companyId, formId],
    );

    const emails = new Set<string>();
    for (const r of rows) {
      const list = Array.isArray(r.emails)
        ? r.emails
        : typeof r.emails === 'string'
          ? [r.emails]
          : [];
      list.forEach((e: string) => e && emails.add(e));
    }

    if (!emails.size) return;

    try {
      await this.comms.sendEmail({
        companyId,
        to: Array.from(emails),
        subject: `Lembrete: formulário "${formTitle}"`,
        template: 'forms/deadline-reminder',
        data: {
          title: formTitle,
          deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
          formId,
        },
        // From do alias vem do MAIL_FROM; se quiser forçar:
        // from: 'Iuppy Forms <comunicacao@iuppy.com.br>',
        // replyTo herdado de MAIL_REPLY_TO
      });
    } catch (e) {
      this.log.warn(`forms: error sending reminder email: ${String(e)}`);
    }
  }
}
