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
import { AssessmentStatus, PerformanceCycleStatus } from '@shared/types';
import { CommunicationsService } from '../../notifications/communications.service';

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
        private readonly notifications: CommunicationsService,
    ) { }

    async createCycle(dto: CreatePerformanceCycleDto) {
        const cycle = this.cycleRepo.create(dto as any);
        return this.cycleRepo.save(cycle);
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

    async calculate9Box(userId: string, cycleId: string) {
        // 1. Calculate Results (X-Axis) based on Goal Completion
        const goals = await this.goalRepo.find({ where: { userId } });
        const avgProgress = goals.length > 0
            ? goals.reduce((acc, g) => acc + g.progress, 0) / goals.length
            : 0;

        let xAxis = 'Low';
        if (avgProgress >= 70) xAxis = 'Medium';
        if (avgProgress >= 100) xAxis = 'High';

        // 2. Calculate Competencies (Y-Axis) based on Assessment Scores
        // Fetch all forms for this user in this cycle where THEY are the target
        const forms = await this.formRepo.find({ where: { cycleId, targetUserId: userId } });

        // Very simplified logic: Average of all scores from all forms
        // In production: Weighted average (Manager 50%, Peer 30%, Self 20%)
        let totalScore = 0;
        let count = 0;

        for (const f of forms) {
            const answers = await this.answerRepo.find({ where: { formId: f.id } });
            const numericAnswers = answers.filter(a => a.score !== null && a.score !== undefined);
            const formSum = numericAnswers.reduce((acc, a) => acc + (a.score || 0), 0);

            if (numericAnswers.length > 0) {
                totalScore += (formSum / numericAnswers.length);
                count++;
            }
        }

        const avgScore = count > 0 ? totalScore / count : 0; // 1-5 scale

        let yAxis = 'Low';
        if (avgScore >= 3) yAxis = 'Medium';
        if (avgScore >= 4.5) yAxis = 'High';

        return {
            userId,
            cycleId,
            scoreX: avgProgress,
            scoreY: avgScore,
            quadrant: `${xAxis}-${yAxis}`, // "High-High" = Top Right
        };
    }

    async calibrate(dto: CalibrateUserDto) {
        // In a real DB we would store this in a 'CalibrationResultEntity'
        // preventing modifying the raw calculation.
        // For this Mission, assuming we return the DTO as confirmation logic.
        return {
            ...dto,
            status: 'CALIBRATED',
            calibratedAt: new Date(),
        };
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

        if (activeCycleId) {
            // Find all users who have forms in this cycle
            const forms = await this.formRepo.find({
                where: { cycleId: activeCycleId },
                select: ['targetUserId']
            });
            const uniqueUsers = [...new Set(forms.map(f => f.targetUserId))];

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
            nineBoxDistribution
        };
    }
}
