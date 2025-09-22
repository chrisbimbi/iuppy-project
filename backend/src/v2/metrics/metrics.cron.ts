// src/v2/metrics/metrics.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { MetricsDailyServiceV2 } from './metrics-daily.service';

let hasSchedule = false;
let Cron: any;
let CronExpression: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sch = require('@nestjs/schedule');
  Cron = sch.Cron;
  CronExpression = sch.CronExpression;
  hasSchedule = !!Cron && !!CronExpression;
} catch { hasSchedule = false; }

// Se houver schedule, registramos um cron simples; se não, exportamos um no-op
let ExportedClass: any;

if (hasSchedule) {
  @Injectable()
  class MetricsCronV2Real {
    private readonly log = new Logger(MetricsCronV2Real.name);
    constructor(private readonly metrics: MetricsDailyServiceV2) {}

    @Cron(CronExpression.EVERY_HOUR)
    async rollupHourly() {
      // Aqui você pode acionar rollups, p95 de latência etc. Mantido leve.
      this.log.debug('metrics hourly rollup tick');
    }
  }
  ExportedClass = MetricsCronV2Real;
} else {
  @Injectable()
  class MetricsCronV2Noop {
    // no-op
  }
  ExportedClass = MetricsCronV2Noop;
}

export { ExportedClass as MetricsCronV2 };