
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { VacationRequestEntity } from '../entities/vacation-request.entity';
import { VacationBalanceEntity } from '../entities/vacation-balance.entity';
import { UserEntity } from '../../../users/user.entity';

export interface VacationSuggestion {
    startDate: Date;
    endDate: Date;
    score: number;
    reason: string;
}

@Injectable()
export class SmartCalendarService {
    private readonly logger = new Logger(SmartCalendarService.name);

    constructor(
        @InjectRepository(VacationRequestEntity)
        private requestRepo: Repository<VacationRequestEntity>,
        @InjectRepository(VacationBalanceEntity)
        private balanceRepo: Repository<VacationBalanceEntity>,
    ) { }

    async suggestVacations(userId: string): Promise<VacationSuggestion[]> {
        // 1. Check Balances
        const balances = await this.balanceRepo.find({
            where: { userId },
            order: { concessiveLimitDate: 'ASC' }
        });

        if (!balances.length) {
            return [];
        }

        const criticalBalance = balances.find(b => b.balanceTotal > 0);
        if (!criticalBalance) return [];

        // 2. Mock Logic: Suggest dates 3 months from now
        // Real logic would check team availability, but for this phase we focus on the structure.
        const suggestedDate = new Date();
        suggestedDate.setMonth(suggestedDate.getMonth() + 3);

        return [
            {
                startDate: suggestedDate,
                endDate: new Date(suggestedDate.getTime() + (15 * 24 * 60 * 60 * 1000)), // +15 days
                score: 85,
                reason: `You have ${criticalBalance.balanceTotal} days explicitly available. Your limit is ${criticalBalance.concessiveLimitDate}.`
            }
        ];
    }
}
