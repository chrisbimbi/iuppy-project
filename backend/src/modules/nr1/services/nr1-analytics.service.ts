import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1RiskRecord } from '../entities/nr1-risk-record.entity';
import { Nr1ActionPlan, ActionStatus } from '../entities/nr1-action-plan.entity';
import { Nr1TrainingAttempt } from '../entities/nr1-training-attempt.entity';
import { Nr1EmergencyDrill } from '../entities/nr1-emergency-drill.entity';
import { Nr1DrillAttendance } from '../entities/nr1-drill-attendance.entity';
// [NEW] Hub Integrations
import { NewsEntity } from '../../../news/news.entity';
import { FormEntity } from '../../../modules/forms/entities/form.entity';
import { JourneyEntity } from '../../../modules/journeys/entities/journey.entity';
import { UserJourneyInstanceEntity, JourneyInstanceStatus } from '../../../modules/journeys/entities/user-journey-instance.entity';
import { StepCompletionEntity } from '../../../modules/journeys/entities/step-completion.entity';

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
        @InjectRepository(Nr1DrillAttendance)
        private readonly drillAttendanceRepo: Repository<Nr1DrillAttendance>,
        // [NEW] Hub Repos
        @InjectRepository(NewsEntity)
        private readonly newsRepo: Repository<NewsEntity>,
        @InjectRepository(FormEntity)
        private readonly formRepo: Repository<FormEntity>,
        @InjectRepository(JourneyEntity)
        private readonly journeyRepo: Repository<JourneyEntity>,
        @InjectRepository(UserJourneyInstanceEntity)
        private readonly journeyInstanceRepo: Repository<UserJourneyInstanceEntity>,
        @InjectRepository(StepCompletionEntity)
        private readonly stepCompletionRepo: Repository<StepCompletionEntity>,
    ) { }

    async getDashboardStats(companyId: string) {
        // 1. Risks
        const totalRisks = await this.riskRepo.countBy({ company_id: companyId });

        const risksByLevel = await this.riskRepo.createQueryBuilder('r')
            .select('r.classificacao_risco', 'level')
            .addSelect('COUNT(*)', 'count')
            .where('r.company_id = :companyId', { companyId })
            .groupBy('r.classificacao_risco')
            .getRawMany();

        const riskCounts = {
            high: 0,
            medium: 0,
            low: 0
        };

        risksByLevel.forEach(r => {
            const count = parseInt(r.count);
            // Map 'a'/'ma' to high, 'm' to medium, 'b' to low
            // Assuming RiskLevel enum usage or string match
            if (r.level === 'a' || r.level === 'ma' || r.level?.includes?.('Al')) riskCounts.high += count;
            else if (r.level === 'm' || r.level?.includes?.('Med')) riskCounts.medium += count;
            else riskCounts.low += count;
        });

        // 2. Action Plans (Progress)
        // Kept for internal logic if needed, but not returned in simplified V2 risks object used by widget
        // The widget only uses risks.total/high/medium/low. It REMOVED actionPlanProgress usage in my last edit?
        // Wait, Widget V2 'Nr1StatsWidget' renders:
        // stats.risks.high, stats.risks.total, stats.risks.medium, stats.risks.low.
        // It does NOT use actionPlanProgress anymore. I removed it. Good.

        // 3. NR-1 Trainings (Real Data from Journeys)
        const nr1Journeys = await this.journeyRepo.find({
            where: { companyId, isNr1: true, active: true },
            relations: ['steps'],
        });

        let totalEnrollments = 0;
        let totalCompletions = 0;
        let totalQuizScores: number[] = [];

        for (const journey of nr1Journeys) {
            const instances = await this.journeyInstanceRepo.count({
                where: { journeyId: journey.id },
            });
            totalEnrollments += instances;

            const completedInstances = await this.journeyInstanceRepo.count({
                where: { journeyId: journey.id, status: JourneyInstanceStatus.COMPLETED },
            });
            totalCompletions += completedInstances;

            // Simplified quiz score fetching to avoid heavy loop if possible
            // ... keeping logic for now
        }

        const trainingCompletionRate = totalEnrollments > 0
            ? Math.round((totalCompletions / totalEnrollments) * 100)
            : 0;

        // 4. Drills (Real Data)
        const allDrills = await this.drillRepo.find({
            where: { company_id: companyId },
        });

        let totalDrillSlots = 0;
        let totalAttendances = 0;
        for (const drill of allDrills) {
            const attendances = await this.drillAttendanceRepo.count({ where: { drill_id: drill.id } });
            totalAttendances += attendances;
            totalDrillSlots += 10;
        }

        // Return strictly aligned structure
        return {
            risks: {
                total: totalRisks,
                high: riskCounts.high,
                medium: riskCounts.medium,
                low: riskCounts.low
            },
            training: {
                completionRate: trainingCompletionRate,
                total: nr1Journeys.length,
                completed: totalCompletions,
                overdue: 0 // Mock for now
            },
            drills: {
                total: allDrills.length,
                participated: totalAttendances
            },
            eSocial: {
                pendingEvents: 0,
                lastSync: null
            },
            documents: 0, // Mock
            checklists: 0 // Mock
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
