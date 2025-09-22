import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';

interface BatchEvent {
  type: 'app_open' | 'module_open';
  at: string; // ISO
  meta?: Record<string, any>;
}

@Injectable()
export class TrackV2Service {
  constructor(
    @InjectRepository(UserMetricsDailyEntity)
    private readonly uDailyRepo: Repository<UserMetricsDailyEntity>,
  ) {}

  private toDate(atISO: string): string {
    const d = new Date(atISO);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10);
  }

  async batch(companyId: string, userId: string, events: BatchEvent[]) {
    if (!events?.length) return { ok: true, updated: 0 };
    let updated = 0;

    // agregamos por dia
    const perDay: Record<string, number> = {};
    for (const ev of events) {
      if (ev.type !== 'app_open' && ev.type !== 'module_open') continue;
      const day = this.toDate(ev.at);
      perDay[day] = (perDay[day] || 0) + 1;
    }

    for (const [date, count] of Object.entries(perDay)) {
      await this.uDailyRepo
        .createQueryBuilder()
        .insert()
        .into(UserMetricsDailyEntity)
        .values({ userId, date, appOpens: count })
        .orUpdate(['appOpens'], ['userId', 'date'], { skipUpdateIfNoValuesChanged: false })
        .execute();

      // increment appOpens (se já existir, somar)
      await this.uDailyRepo.query(
        `UPDATE user_metrics_daily SET "appOpens" = COALESCE("appOpens",0) + $1 WHERE "userId"=$2 AND "date"=$3`,
        [count, userId, date],
      );
      updated += count;
    }

    return { ok: true, updated };
  }
}