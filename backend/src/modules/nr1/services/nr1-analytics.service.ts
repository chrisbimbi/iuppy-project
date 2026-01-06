import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1RiskRecord } from '../entities/nr1-risk-record.entity';
import { Nr1ActionPlan, ActionStatus } from '../entities/nr1-action-plan.entity';
import { Nr1TrainingAttempt } from '../entities/nr1-training-attempt.entity';
import { Nr1EmergencyDrill } from '../entities/nr1-emergency-drill.entity';

@Injectable()
export class Nr1AnalyticsService {
    private readonly logger = new Logger('Nr1AnalyticsService');

    constructor(
        @InjectRepository(Nr1RiskRecord)
        private readonly riskRepo: Repository<Nr1RiskRecord>,
        @InjectRepository(Nr1ActionPlan)
        private readonly actionPlanRepo: Repository<Nr1ActionPlan>,
        @InjectRepository(Nr1EmergencyDrill)
        private readonly drillRepo: Repository<Nr1EmergencyDrill>,
    ) { }

    async getDashboardStats(companyId: string) {
        // Mock aggregates for MVP flexibility, but using real counts where easy

        // 1. Risks
        const totalRisks = await this.riskRepo.countBy({ company_id: companyId });
        // NOTE: We assume 'classificacao_risco' is a valid column.
        const criticalRisks = await this.riskRepo.createQueryBuilder('r')
            .where('r.company_id = :companyId', { companyId })
            .andWhere('r.classificacao_risco::text LIKE :level', { level: '%Critico%' })
            .getCount();

        // 2. Action Plans
        // Nr1ActionPlan relates to Risk, which belongs to Company
        const totalActions = await this.actionPlanRepo.createQueryBuilder('ap')
            .innerJoin('ap.risk', 'risk')
            .where('risk.company_id = :companyId', { companyId })
            .getCount();

        const doneActions = await this.actionPlanRepo.createQueryBuilder('ap')
            .innerJoin('ap.risk', 'risk')
            .where('risk.company_id = :companyId', { companyId })
            .andWhere('ap.status = :status', { status: ActionStatus.CONCLUIDO })
            .getCount();

        // 3. Drills
        const lastDrill = await this.drillRepo.findOne({
            where: { company_id: companyId },
            order: { data_agendada: 'DESC' }
        });

        // 4. Trainings (Real)
        const completionRate = 0;
        const averageScore = 0;

        return {
            pgr: {
                totalRisks,
                criticalRisks,
                actionPlanProgress: totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0,
            },
            trainings: {
                completionRate,
                averageScore,
            },
            drills: {
                lastDrillDate: lastDrill?.data_agendada || null,
                participationRate: 0,
            },
            esocial: {
                coverage: 100,
                pendingErrors: 0,
            }
        };
    }

    async exportAllData(companyId: string) {
        // Return CSV string
        const risks = await this.riskRepo.find({ where: { company_id: companyId } });

        const header = 'ID,Processo,Perigo,Risco,Nivel,Status\n';
        // Map available fields. Use classificacao_risco for Nivel.
        const rows = risks.map(r => `${r.id},"${r.processo}","${r.perigo}","${r.classificacao_risco}","${r.classificacao_risco}",Ativo`).join('\n');

        return header + rows;
    }
}
