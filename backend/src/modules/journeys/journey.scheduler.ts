import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JourneysService } from './journeys.service';

@Injectable()
export class JourneyScheduler {
  constructor(private readonly journeysService: JourneysService) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDailyUnlock() {
    await this.journeysService.checkAndUnlockSteps();
  }
}
