import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { FormsRemindersService } from './forms-reminders.service';

@Injectable()
export class FormsRemindersCron {
  private readonly log = new Logger(FormsRemindersCron.name);

  constructor(
    private readonly ds: DataSource,
    private readonly reminders: FormsRemindersService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle() {
    if (process.env.FORMS_REMINDERS_ENABLED === '0') return;

    this.log.log('[cron] forms reminders start');

    const companies = await this.ds.query(`
      SELECT DISTINCT "companyId"
        FROM form
       WHERE status = 'published'
         AND "deadlineAt" IS NOT NULL
    `);

    for (const row of companies) {
      const companyId = row.companyId;
      try {
        await this.reminders.runForCompany(companyId);
      } catch (e) {
        this.log.warn(
          `[cron] error running reminders for company ${companyId}: ${String(e)}`,
        );
      }
    }

    this.log.log('[cron] forms reminders done');
  }
}
