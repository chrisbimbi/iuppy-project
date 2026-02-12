import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { VacationRequestEntity } from './entities/vacation-request.entity';
import { VacationBalanceEntity } from './entities/vacation-balance.entity';
import { CompanyEntity } from '../../companies/company.entity';
import { VacationRequestStatus } from '@shared/types';
import { VacationsService } from './vacations.service';
import * as dayjs from 'dayjs';

@Controller('vacations/analytics')
export class VacationAnalyticsController {
    constructor(
        @InjectRepository(VacationRequestEntity)
        private readonly requestRepo: Repository<VacationRequestEntity>,
        @InjectRepository(VacationBalanceEntity)
        private readonly balanceRepo: Repository<VacationBalanceEntity>,
        @InjectRepository(CompanyEntity)
        private readonly companyRepo: Repository<CompanyEntity>,
        private readonly vacationsService: VacationsService,
    ) { }

    @Get('liability')
    async getLiability() {
        const company = await this.companyRepo.findOne({ where: {} });
        if (!company) return { totalDays: 0, estimatedCost: 0 };

        const stats = await this.vacationsService.getDashboardStats(company.id);

        // Fetch balances to get breakdown for the Pie Chart in the dashboard
        const balances = await this.balanceRepo.find({ where: { user: { companyId: company.id } } });
        const taken = balances.reduce((acc, b) => acc + Number(b.daysTaken), 0);
        const sold = balances.reduce((acc, b) => acc + Number(b.daysSold), 0);
        const totalBalance = balances.reduce((acc, b) => acc + Number(b.balanceTotal), 0);

        return {
            totalDays: totalBalance,
            estimatedCost: stats.financialLiability,
            taken,
            sold,
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
