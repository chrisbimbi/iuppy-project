import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceCycleEntity } from './entities/performance-cycle.entity';
import { GoalEntity } from './entities/goal.entity';
import { AssessmentFormEntity } from './entities/assessment-form.entity';
import { AssessmentAnswerEntity } from './entities/assessment-answer.entity';
import { CreatePerformanceCycleDto } from './dto/create-performance-cycle.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { CalibrateUserDto } from './dto/calibrate-user.dto';
import { OneOnOneEntity } from './entities/one-on-one.entity';
import { PDIEntity } from './entities/pdi.entity';
import { PDIActionEntity } from './entities/pdi-action.entity';
import { CalibrationResultEntity } from './entities/calibration-result.entity';
import { AssessmentStatus, PerformanceCycleStatus, AssessmentType } from '@shared/types';
import { CommunicationsService } from '../../notifications/communications.service';

import { UserEntity } from '../../users/user.entity';

@Injectable()
export class PerformanceService {
    constructor(
        @InjectRepository(PerformanceCycleEntity)
        private readonly cycleRepo: Repository<PerformanceCycleEntity>,
        @InjectRepository(GoalEntity)
        private readonly goalRepo: Repository<GoalEntity>,
        @InjectRepository(AssessmentFormEntity)
        private readonly formRepo: Repository<AssessmentFormEntity>,
        @InjectRepository(AssessmentAnswerEntity)
        private readonly answerRepo: Repository<AssessmentAnswerEntity>,
        @InjectRepository(OneOnOneEntity)
        private readonly oneOnOneRepo: Repository<OneOnOneEntity>,
        @InjectRepository(PDIEntity)
        private readonly pdiRepo: Repository<PDIEntity>,
        @InjectRepository(PDIActionEntity)
        private readonly pdiActionRepo: Repository<PDIActionEntity>,
        @InjectRepository(CalibrationResultEntity)
        private readonly calibrationRepo: Repository<CalibrationResultEntity>,
        @InjectRepository(UserEntity)
        private readonly usersRepo: Repository<UserEntity>,
        private readonly notifications: CommunicationsService,
    ) { }

    async createCycle(dto: CreatePerformanceCycleDto) {
        const cycle = this.cycleRepo.create(dto as any);
        return this.cycleRepo.save(cycle);
    }

    async getActiveCycle(companyId?: string) {
        const where: any = { status: PerformanceCycleStatus.ACTIVE };
        if (companyId) {
            where.companyId = companyId;
        }
        return this.cycleRepo.findOne({ where });
    }

    async createGoal(dto: CreateGoalDto) {
        const goal = this.goalRepo.create(dto);
        return this.goalRepo.save(goal);
    }

    async updateGoal(id: string, dto: Partial<GoalEntity>) {
        await this.goalRepo.update(id, dto);
        return this.goalRepo.findOne({ where: { id } });
    }

    async deleteGoal(id: string) {
        await this.goalRepo.delete(id);
        return { success: true };
    }

    async getGoals(userId: string) {
        return this.goalRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async getPDI(userId: string) {
        return this.pdiRepo.find({
            where: { userId },
            relations: ['actions'],
            order: { createdAt: 'DESC' }
        });
    }

    async updatePDIAction(actionId: string, status: string) {
        await this.pdiActionRepo.update(actionId, { status: status as any });
        return { success: true };
    }

    async submitAssessment(dto: any) {
        const form = await this.formRepo.findOne({ where: { id: dto.formId } });
        if (!form) throw new NotFoundException('Assessment form not found');

        // Save Answers
        const answers = dto.answers.map(a => this.answerRepo.create({
            formId: form.id,
            questionId: a.questionId,
            score: a.score,
            textAnswer: a.textAnswer,
        }));
        await this.answerRepo.save(answers);

        // Update Form Status
        form.status = AssessmentStatus.SUBMITTED;
        await this.formRepo.save(form);

        // Notify Manager (Evalutator usually notifies Target, or Self notifies Manager)
        await this.notifications.sendPush({
            companyId: 'DEFAULT',
            userIds: [form.evaluatorUserId], // Notify the other party? logic varies. Assuming notifying manager/evaluator that task is done.
            title: 'Avaliação Recebida',
            body: 'Uma avaliação foi submetida.',
            kind: 'PERFORMANCE_SUBMITTED',
            entityId: form.id
        });

        return { success: true };
    }

    async getParticipants(cycleId: string, department?: string) {
        // Enforce cycle existence
        const cycle = await this.cycleRepo.findOneBy({ id: cycleId });
        if (!cycle) throw new NotFoundException('Ciclo não encontrado');

        // Fetch users (filtered by department if provided)
        const query = this.usersRepo.createQueryBuilder('user')
            .where('user.companyId = :companyId', { companyId: cycle.companyId })
            .andWhere('user.isActive = true');

        if (department) {
            query.andWhere('user.department = :department', { department });
        }

        const users = await query.getMany();

        // For each user, get current quadrant (from Calibration or calculate from forms)
        const participants = await Promise.all(users.map(async (u) => {
            // Check if calibrated result exists
            const calibration = await this.calibrationRepo.findOneBy({ userId: u.id, cycleId });

            if (calibration) {
                return {
                    id: u.id,
                    name: u.name,
                    department: u.department,
                    quadrant: calibration.quadrant,
                    isCalibrated: true
                };
            }

            // Otherwise calculate on the fly (or return blank if no assessment yet)
            const box = await this.calculate9Box(u.id, cycleId);
            return {
                id: u.id,
                name: u.name,
                department: u.department,
                quadrant: box.quadrant || 'Low-Low', // Fallback
                isCalibrated: false
            };
        }));

        return participants;
    }
    async calculate9Box(userId: string, cycleId: string) {
        // 1. Calculate Results (X-Axis) based on Goal Completion
        const goals = await this.goalRepo.find({ where: { userId } });
        const avgProgress = goals.length > 0
            ? goals.reduce((acc, g) => acc + g.progress, 0) / goals.length
            : 0;

        let xAxis = 'Low';
        if (avgProgress >= 70) xAxis = 'Medium';
        if (avgProgress >= 100) xAxis = 'High';

        // 2. Calculate Competencies (Y-Axis) based on Weighted Assessment Scores
        const forms = await this.formRepo.find({
            where: { cycleId, targetUserId: userId, status: AssessmentStatus.SUBMITTED }
        });

        const scoresByType: Record<string, number[]> = {
            [AssessmentType.SELF]: [],
            [AssessmentType.MANAGER]: [],
            [AssessmentType.PEER]: [],
        };

        for (const f of forms) {
            const answers = await this.answerRepo.find({ where: { formId: f.id } });
            const numericAnswers = answers.filter(a => a.score !== null && a.score !== undefined);
            const formAvg = numericAnswers.length > 0
                ? numericAnswers.reduce((acc, a) => acc + (a.score || 0), 0) / numericAnswers.length
                : 0;

            if (formAvg > 0) {
                scoresByType[f.type].push(formAvg);
            }
        }

        // Weighted Average Logic: Self (20%), Peer (30%), Manager (50%)
        let weightedScore = 0;
        let totalWeight = 0;
        const weights = { [AssessmentType.SELF]: 0.2, [AssessmentType.PEER]: 0.3, [AssessmentType.MANAGER]: 0.5 };

        for (const type of Object.values(AssessmentType)) {
            if (scoresByType[type].length > 0) {
                const typeAvg = scoresByType[type].reduce((a, b) => a + b, 0) / scoresByType[type].length;
                weightedScore += typeAvg * weights[type];
                totalWeight += weights[type];
            }
        }

        const finalScoreY = totalWeight > 0 ? weightedScore / totalWeight : 0;
        let yAxis = 'Low';
        if (finalScoreY >= 3) yAxis = 'Medium';
        if (finalScoreY >= 4) yAxis = 'High';

        return {
            scoreX: avgProgress,
            scoreY: finalScoreY,
            quadrant: `${yAxis}-${xAxis}`
        };
    }


    async calibrate(dto: CalibrateUserDto) {
        let result = await this.calibrationRepo.findOne({
            where: { userId: dto.userId, cycleId: dto.cycleId }
        });

        if (!result) {
            result = this.calibrationRepo.create({
                userId: dto.userId,
                cycleId: dto.cycleId,
            });
        }

        result.quadrant = dto.quadrant;
        result.scoreX = dto.scoreX;
        result.scoreY = dto.scoreY;
        result.justification = dto.justification;
        result.calibratedAt = new Date();
        result.calibratorId = dto.calibratorId;

        return this.calibrationRepo.save(result);
    }

    // --- 1:1 Meetings ---

    async createOneOnOne(dto: any) {
        // dto: { organizerUserId, participantUserId, scheduledDate, ... }
        // In a real scenario, we'd use a specific DTO class
        const mtg = this.oneOnOneRepo.create(dto);
        return this.oneOnOneRepo.save(mtg);
    }

    async listOneOnOnes(userId: string, targetId: string) {
        // If targetId is provided, filter by that specific pair.
        // Otherwise, list all meetings involved with userId.
        const q = this.oneOnOneRepo.createQueryBuilder('o')
            .where('o.organizerUserId = :uid OR o.participantUserId = :uid', { uid: userId });

        if (targetId) {
            // Refine to specific pair
            q.andWhere('(o.organizerUserId = :tid OR o.participantUserId = :tid)', { tid: targetId });
        }

        return q.orderBy('o.scheduledDate', 'DESC').getMany();
    }

    async updateOneOnOnePoints(id: string, talkingPoints: any[]) {
        await this.oneOnOneRepo.update(id, { talkingPoints });
        return { success: true };
    }

    async completeOneOnOne(id: string) {
        await this.oneOnOneRepo.update(id, { status: 'COMPLETED' });
        return { success: true };
    }

    async getDashboardStats(companyId: string) {
        // 1. Active Cycles
        const activeCycles = await this.cycleRepo.find({ where: { companyId, status: PerformanceCycleStatus.ACTIVE } });
        const activeCycleId = activeCycles.length > 0 ? activeCycles[0].id : null;

        // 2. Goal Stats
        const totalGoals = await this.goalRepo.count({ where: { user: { companyId } } });

        // 3. 9-Box Distribution (Simplified Aggregation)
        // We need users who have BOTH goals (X-axis) and received assessments (Y-axis) in the active cycle.
        // For performance, we'll iterate active users or just fetch cached calibration results if available.
        // Here we will do a live aggregation which is heavy but accurate.

        const nineBoxDistribution = {
            'Low-Low': 0, 'Low-Medium': 0, 'Low-High': 0,
            'Medium-Low': 0, 'Medium-Medium': 0, 'Medium-High': 0,
            'High-Low': 0, 'High-Medium': 0, 'High-High': 0
        };

        const completionStats = {
            self: { total: 0, submitted: 0 },
            manager: { total: 0, submitted: 0 }
        };

        if (activeCycleId) {
            // Find all users who have forms in this cycle
            const forms = await this.formRepo.find({
                where: { cycleId: activeCycleId },
                select: ['id', 'targetUserId', 'type', 'status']
            });
            const uniqueUsers = [...new Set(forms.map(f => f.targetUserId))];

            // Completion Stats
            forms.forEach(f => {
                if (f.type === AssessmentType.SELF) {
                    completionStats.self.total++;
                    if (f.status === AssessmentStatus.SUBMITTED) completionStats.self.submitted++;
                } else if (f.type === AssessmentType.MANAGER) {
                    completionStats.manager.total++;
                    if (f.status === AssessmentStatus.SUBMITTED) completionStats.manager.submitted++;
                }
            });

            for (const userId of uniqueUsers) {
                try {
                    const box = await this.calculate9Box(userId, activeCycleId);
                    if (nineBoxDistribution[box.quadrant] !== undefined) {
                        nineBoxDistribution[box.quadrant]++;
                    }
                } catch (e) { }
            }
        }

        return {
            activeCycles: activeCycles.length,
            totalGoals,
            nineBoxDistribution,
            completionStats
        };
    }

    async getTurnoverRisk(companyId: string) {
        // 1. Identify Risk Groups based on 9-Box
        // High Risk: Low-Low, Low-Medium
        // Medium Risk: Medium-Low, Low-High

        // We reuse the 9-box distribution logic or fetch from cache
        const stats = await this.getDashboardStats(companyId);
        const dist = stats.nineBoxDistribution;

        const highRiskCount = (dist['Low-Low'] || 0) + (dist['Low-Medium'] || 0);
        const mediumRiskCount = (dist['Medium-Low'] || 0) + (dist['Low-High'] || 0);

        // Avg Risk Score (Inverse of Performance?)
        // Let's say max risk is 1.0. 
        // 0.8-1.0 = High Risk. 
        // We can simulate a score based on the ratio of low performers.
        const totalUsers = Object.values(dist).reduce((a: number, b: number) => a + b, 0);
        const riskRatio = totalUsers > 0 ? (highRiskCount + mediumRiskCount * 0.5) / totalUsers : 0;

        return {
            highRiskCount,
            mediumRiskCount,
            avgRiskScore: Number(riskRatio.toFixed(2)),
            trend: '+1.5%' // Mock trend for now as we don't have time-series risk data yet
        };
    }

    async getPerformanceEvolution(companyId: string) {
        // Fetch last 6 closed cycles + active
        const cycles = await this.cycleRepo.find({
            where: { companyId },
            order: { endDate: 'ASC' },
            take: 6
        });

        // For each cycle, calculate average company score (Y-axis: Competencies)
        const evolution = [];

        for (const cycle of cycles) {
            // This is heavy, in prod we would cache this "cycle average" property on the CycleEntity
            const forms = await this.formRepo.find({ where: { cycleId: cycle.id, status: AssessmentStatus.SUBMITTED } });

            let totalScore = 0;
            let count = 0;

            for (const f of forms) {
                // We need the score. We can re-calc or check if we stored it. 
                // We didn't store form-level score efficiently in Phase 1 (calculated on fly).
                // Fast path: Just count submitted forms as "engagement" or calc average from answers
                // Let's do a simple count of average answers to be somewhat real
                const answers = await this.answerRepo.find({ where: { formId: f.id } });
                const numeric = answers.filter(a => a.score !== undefined);
                if (numeric.length > 0) {
                    const avg = numeric.reduce((a, b) => a + (b.score || 0), 0) / numeric.length;
                    totalScore += avg;
                    count++;
                }
            }

            evolution.push({
                cycleName: cycle.name,
                averageScore: count > 0 ? Number((totalScore / count).toFixed(2)) : 0
            });
        }

        return evolution;
    }
}
