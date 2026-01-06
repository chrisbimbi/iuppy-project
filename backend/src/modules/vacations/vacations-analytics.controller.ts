import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacationRequestEntity } from './entities/vacation-request.entity';
import { VacationRequestStatus } from '@shared/types';
import * as dayjs from 'dayjs';

@Controller('vacations/analytics')
export class VacationAnalyticsController {
    constructor(
        @InjectRepository(VacationRequestEntity)
        private readonly requestRepo: Repository<VacationRequestEntity>,
    ) { }

    @Get('liability')
    async getLiability() {
        // Mock liability calculation: 
        // In real app, sum (balance.days * user.dailySalary).
        // Since we don't have salary data, we return just total days.
        return {
            totalDays: 1250,
            estimatedCost: 1250 * 500, // random avg daily salary
            currency: 'BRL'
        };
    }

    @Get('heatmap')
    async getHeatmap() {
        // Count approved requests per month for current year
        const currentYear = dayjs().year();
        const start = dayjs().year(currentYear).startOf('year').toDate();
        const end = dayjs().year(currentYear).endOf('year').toDate();

        const requests = await this.requestRepo.createQueryBuilder('req')
            .where('req.status = :status', { status: VacationRequestStatus.APPROVED })
            .andWhere('req.startDate >= :start', { start })
            .andWhere('req.endDate <= :end', { end })
            .getMany();

        const monthlyCounts = Array(12).fill(0);

        requests.forEach(req => {
            const m = dayjs(req.startDate).month(); // 0-11
            monthlyCounts[m]++;
        });

        return {
            year: currentYear,
            monthlyCounts
        };
    }
}
