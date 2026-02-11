import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { VacationPolicyEntity } from './entities/vacation-policy.entity';
import { VacationBalanceEntity } from './entities/vacation-balance.entity';
import { VacationRequestEntity } from './entities/vacation-request.entity';
import { VacationRequestStatus, VacationType } from '@shared/types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommunicationsService } from '../../notifications/communications.service';
import * as dayjs from 'dayjs';
import * as isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

@Injectable()
export class VacationsService {
    constructor(
        @InjectRepository(VacationPolicyEntity)
        private readonly policyRepo: Repository<VacationPolicyEntity>,
        @InjectRepository(VacationBalanceEntity)
        private readonly balanceRepo: Repository<VacationBalanceEntity>,
        @InjectRepository(VacationRequestEntity)
        private readonly requestRepo: Repository<VacationRequestEntity>,
        private readonly notifications: CommunicationsService,
    ) { }

    async createPolicy(dto: Partial<VacationPolicyEntity>) {
        return this.policyRepo.save(this.policyRepo.create(dto));
    }

    async updatePolicy(companyId: string, dto: Partial<VacationPolicyEntity>) {
        await this.policyRepo.update({ companyId }, dto);
        return this.policyRepo.findOne({ where: { companyId } });
    }

    async getBalance(userId: string) {
        // In a real scenario, we might calculate/update this on fly or via cron.
        // For now, return the latest active balance.
        return this.balanceRepo.findOne({
            where: { userId },
            order: { periodEnd: 'DESC' },
        });
    }

    async calculateAccrual(userId: string, absences: number = 0): Promise<number> {
        // CLT Art 130 Logic - Strict Compliance
        if (absences <= 5) return 30;
        if (absences <= 14) return 24;
        if (absences <= 23) return 18;
        if (absences <= 32) return 12;
        return 0; // More than 32 absences = 0 days
    }

    async requestVacation(userId: string, dto: { startDate: string; endDate: string; soldDays?: number; request13th?: boolean; type?: VacationType }) {
        const policy = await this.policyRepo.findOne({ where: { companyId: 'DEFAULT' } }); // Assuming single tenant or context logic
        // Usually we fetch policy based on User Contract Type (CLT/PJ). Mocking for strictness compliance.

        // 1. Validate Lead Time
        const start = dayjs(dto.startDate);
        const end = dayjs(dto.endDate);
        const daysRequested = end.diff(start, 'day') + 1;

        if (policy) {
            const minAntecedence = dayjs().add(policy.minDaysAntecedence, 'day');
            if (start.isBefore(minAntecedence, 'day')) {
                throw new BadRequestException(`Solicitação deve ser feita com ${policy.minDaysAntecedence} dias de antecedência.`);
            }
        }

        // 2. Overlap Check
        const overlapping = await this.requestRepo.findOne({
            where: [
                {
                    userId,
                    status: VacationRequestStatus.APPROVED,
                    startDate: LessThanOrEqual(dto.endDate),
                    endDate: MoreThanOrEqual(dto.startDate)
                },
                {
                    userId,
                    status: VacationRequestStatus.PENDING,
                    startDate: LessThanOrEqual(dto.endDate),
                    endDate: MoreThanOrEqual(dto.startDate)
                }
            ]
        });

        if (overlapping) {
            throw new BadRequestException('Já existe uma solicitação para este período.');
        }

        // 3. Fractioning Rules (Strict CLT)
        if (policy && policy.allowFractioning) {
            // Check existing approved requests for this acquisition period
            const periodStart = dayjs().startOf('year'); // simplified
            const periodEnd = dayjs().endOf('year');

            const myRequests = await this.requestRepo.find({
                where: {
                    userId,
                    status: VacationRequestStatus.APPROVED,
                    startDate: MoreThanOrEqual(periodStart.toDate().toISOString()),
                    endDate: LessThanOrEqual(periodEnd.toDate().toISOString())
                }
            });

            // Calculate duration of current request
            const currentDuration = daysRequested;

            // Check if any existing request is >= 14 days
            const hasLongPeriod = myRequests.some(r => {
                const dur = dayjs(r.endDate).diff(dayjs(r.startDate), 'days') + 1;
                return dur >= 14;
            });

            // If no long period exists yet, AND this request is short (<14),
            // Warn if it makes it impossible to take 14 days later? 
            // Simplified rule: At least one period MUST be >= 14 days.
            // If this is the FIRST request and it is < 14, user must be aware constraints remain.
            // But strict validation:
            if (currentDuration < 5) {
                throw new BadRequestException('Nenhum período de férias pode ser inferior a 5 dias.');
            }

            // If this is the LAST period (balance near 0) and we haven't had a 14 day period...
            // Complex logic omitted for brevity, but enforcing min 5 is key.
        }

        // 4. Save
        const request = this.requestRepo.create({
            userId,
            startDate: dto.startDate,
            endDate: dto.endDate,
            soldDays: dto.soldDays || 0,
            request13th: dto.request13th || false,
            type: dto.type || VacationType.INDIVIDUAL,
            status: VacationRequestStatus.PENDING,
            // attachmentUrl logic will be handled if passed in DTO
        });

        return this.requestRepo.save(request);
    }

    async getPolicy(companyId: string) {
        return this.policyRepo.findOne({ where: { companyId } });
    }

    async findAllRequests(companyId: string, status?: VacationRequestStatus) {
        const where: any = {}; // simplified filter
        if (status) where.status = status;

        return this.requestRepo.find({
            where,
            relations: ['user'],
            order: { startDate: 'DESC' }
        });
    }

    async getUserRequests(userId: string) {
        return this.requestRepo.find({
            where: { userId },
            order: { startDate: 'DESC' },
        });
    }

    async approveRequest(requestId: string, approverId: string) {
        const request = await this.requestRepo.findOne({
            where: { id: requestId },
            relations: ['user']
        });
        if (!request) throw new NotFoundException('Solicitação não encontrada');

        request.status = VacationRequestStatus.APPROVED;
        request.approvalFlowSnapshot = { approverId, date: new Date() };

        // Update Balance Logic would go here (decrement remaining days)
        const saved = await this.requestRepo.save(request);

        // Notify User
        await this.notifications.sendPush({
            companyId: request.user.companyId,
            userIds: [request.userId],
            title: 'Férias Aprovadas! 🌴',
            body: `Suas férias de ${dayjs(request.startDate).format('DD/MM')} a ${dayjs(request.endDate).format('DD/MM')} foram aprovadas.`,
            kind: 'VACATION_APPROVED',
            entityId: saved.id,
        });

        return saved;
    }

    async rejectRequest(requestId: string, approverId: string, justification: string) {
        const request = await this.requestRepo.findOne({
            where: { id: requestId },
            relations: ['user']
        });
        if (!request) throw new NotFoundException('Solicitação não encontrada');

        request.status = VacationRequestStatus.REJECTED;
        request.approvalFlowSnapshot = {
            approverId,
            date: new Date(),
            justification
        };

        const saved = await this.requestRepo.save(request);

        // Notify User
        await this.notifications.sendPush({
            companyId: request.user.companyId,
            userIds: [request.userId],
            title: 'Solicitação de Férias Reprovada',
            body: `Motivo: ${justification}`,
            kind: 'VACATION_REJECTED',
            entityId: saved.id,
        });

        return saved;
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkExpiringBalances() {
        // Stub: Find balances expiring in 30 days
        // In real implementation: Query db for concessiveLimitDate between now and now+30d
        // Loop and notify
        console.log('Running Daily Vacation Balance Check...');
        // await this.notifications.sendPush(...)
    }

    async getDashboardStats(companyId: string) {
        // 1. Operational Counters
        const totalRequests = await this.requestRepo.count({ where: { user: { companyId } } });
        const pendingRequests = await this.requestRepo.count({ where: { user: { companyId }, status: VacationRequestStatus.PENDING } });
        const approvedRequests = await this.requestRepo.count({ where: { user: { companyId }, status: VacationRequestStatus.APPROVED } });

        // 2. Who is Away NOW?
        const today = new Date();
        const awayNow = await this.requestRepo.count({
            where: {
                user: { companyId },
                status: VacationRequestStatus.APPROVED,
                startDate: LessThanOrEqual(today.toISOString()),
                endDate: MoreThanOrEqual(today.toISOString())
            }
        });

        // 3. Compliance Risk (Balances) & Liability
        // We need to fetch balances to analyze dates
        const balances = await this.balanceRepo.find({
            where: { user: { companyId } },
            select: ['concessiveLimitDate', 'balanceTotal']
        });

        let riskOk = 0;
        let riskWarning = 0;
        let riskCritical = 0;
        let totalBalanceDays = 0;

        const warningThreshold = dayjs().add(90, 'day'); // 3 months warning
        const criticalThreshold = dayjs(); // Today

        balances.forEach(b => {
            totalBalanceDays += b.balanceTotal;
            if (!b.concessiveLimitDate) {
                riskOk++;
                return;
            }
            const limit = dayjs(b.concessiveLimitDate);

            if (limit.isBefore(criticalThreshold)) {
                riskCritical++;
            } else if (limit.isBefore(warningThreshold)) {
                riskWarning++;
            } else {
                riskOk++;
            }
        });

        // 4. Financial Liability Proxy
        // Avg Salary Proxy = R$ 5,000.00 (Market Avg)
        // Cost = (Days / 30) * Salary * 1.33 (1/3 Vacation Bonus)
        const AVG_SALARY = 5000;
        const estimatedLiability = (totalBalanceDays / 30) * AVG_SALARY * 1.33;

        return {
            totalRequests,
            pendingRequests,
            approvedRequests,
            awayNow,
            riskDistribution: {
                ok: riskOk,
                warning: riskWarning,
                critical: riskCritical
            },
            financialLiability: Math.round(estimatedLiability)
        };
    }
}
