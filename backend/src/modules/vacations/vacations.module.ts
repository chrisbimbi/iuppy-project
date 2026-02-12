import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacationPolicyEntity } from './entities/vacation-policy.entity';
import { VacationBalanceEntity } from './entities/vacation-balance.entity';
import { VacationRequestEntity } from './entities/vacation-request.entity';
import { CollectiveVacationEntity } from './entities/collective-vacation.entity';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';
import { VacationAnalyticsController } from './vacations-analytics.controller';

import { NotificationsModule } from '../../notifications/notifications.module';
import { UsersModule } from '../../users/users.module';
import { SmartCalendarService } from './services/smart-calendar.service';

import { CompanyEntity } from '../../companies/company.entity';

@Module({
    imports: [
        NotificationsModule,
        UsersModule,
        TypeOrmModule.forFeature([
            VacationPolicyEntity,
            VacationBalanceEntity,
            VacationRequestEntity,
            CollectiveVacationEntity,
            CompanyEntity,
        ]),
    ],
    controllers: [VacationsController, VacationAnalyticsController],
    providers: [VacationsService, SmartCalendarService],
    exports: [VacationsService, SmartCalendarService],
})
export class VacationsModule { }
