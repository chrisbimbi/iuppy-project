import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacationPolicyEntity } from './entities/vacation-policy.entity';
import { VacationBalanceEntity } from './entities/vacation-balance.entity';
import { VacationRequestEntity } from './entities/vacation-request.entity';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';
import { VacationAnalyticsController } from './vacations-analytics.controller';

import { NotificationsModule } from '../../notifications/notifications.module';
import { SmartCalendarService } from './services/smart-calendar.service';

@Module({
    imports: [
        NotificationsModule,
        TypeOrmModule.forFeature([
            VacationPolicyEntity,
            VacationBalanceEntity,
            VacationRequestEntity,
        ]),
    ],
    controllers: [VacationsController, VacationAnalyticsController],
    providers: [VacationsService, SmartCalendarService],
    exports: [VacationsService, SmartCalendarService],
})
export class VacationsModule { }
