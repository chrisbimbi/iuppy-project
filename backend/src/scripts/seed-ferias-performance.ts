import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource, Like } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { VacationBalanceEntity } from '../modules/vacations/entities/vacation-balance.entity';
import { VacationRequestEntity } from '../modules/vacations/entities/vacation-request.entity';
import { PerformanceCycleEntity } from '../modules/performance/entities/performance-cycle.entity';
import { AssessmentFormEntity } from '../modules/performance/entities/assessment-form.entity';
import { AssessmentAnswerEntity } from '../modules/performance/entities/assessment-answer.entity';
import { CalibrationResultEntity } from '../modules/performance/entities/calibration-result.entity';
import { PDIEntity } from '../modules/performance/entities/pdi.entity';
import { PDIActionEntity } from '../modules/performance/entities/pdi-action.entity';
import { GoalEntity } from '../modules/performance/entities/goal.entity';
import { OneOnOneEntity } from '../modules/performance/entities/one-on-one.entity';
import { AssessmentType, AssessmentStatus, PerformanceCycleStatus, VacationRequestStatus, VacationType, PDIStatus, GoalType, OneOnOneStatus } from '@shared/types';
import * as dayjs from 'dayjs';


async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    // Repositories
    const userRepo = dataSource.getRepository(UserEntity);
    const balanceRepo = dataSource.getRepository(VacationBalanceEntity);
    const requestRepo = dataSource.getRepository(VacationRequestEntity);
    const cycleRepo = dataSource.getRepository(PerformanceCycleEntity);
    const formRepo = dataSource.getRepository(AssessmentFormEntity);
    const answerRepo = dataSource.getRepository(AssessmentAnswerEntity);
    const calibrationRepo = dataSource.getRepository(CalibrationResultEntity);
    const pdiRepo = dataSource.getRepository(PDIEntity);
    const pdiActionRepo = dataSource.getRepository(PDIActionEntity);
    const goalRepo = dataSource.getRepository(GoalEntity);
    const oneOnOneRepo = dataSource.getRepository(OneOnOneEntity);

    console.log('🌱 Seeding HR Data (Vacations & Performance)...');

    const users = await userRepo.find({ where: { email: Like('%@empresa.com.br') } });
    if (users.length === 0) {
        console.error('❌ No mock users found. Please run exhaustive sync first.');
        await app.close();
        return;
    }
    console.log(`👤 Found ${users.length} mock users.`);

    // 1. Create Performance Cycles (if dont exist)
    let pastCycle = await cycleRepo.findOneBy({ name: 'Ciclo de Desempenho 2024' });
    if (!pastCycle) {
        pastCycle = await cycleRepo.save(cycleRepo.create({
            name: 'Ciclo de Desempenho 2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            status: PerformanceCycleStatus.CLOSED,
            companyId: users[0].companyId,
            participantsFilter: {}
        }));
    }

    let activeCycle = await cycleRepo.findOneBy({ name: 'Ciclo de Desempenho 2025 (Atual)' });
    if (!activeCycle) {
        activeCycle = await cycleRepo.save(cycleRepo.create({
            name: 'Ciclo de Desempenho 2025 (Atual)',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            status: PerformanceCycleStatus.ACTIVE,
            companyId: users[0].companyId,
            participantsFilter: {}
        }));
    }

    // Prepare manager map for performance
    const managerMap = new Map<string, string>();
    for (const u of users) {
        if (u.managerEmail) {
            const mgr = users.find(m => m.email === u.managerEmail);
            if (mgr) managerMap.set(u.id, mgr.id);
        }
    }

    let count = 0;
    for (const user of users) {
        count++;
        if (count % 100 === 0) console.log(`Processing... ${count}/${users.length}`);

        // --- 1. VACATIONS ---
        const admission = dayjs(user.admissionDate || '2022-01-01');

        // 3 Acquisition Periods
        for (let i = 0; i < 3; i++) {
            const periodStart = admission.add(i, 'year');
            const periodEnd = periodStart.add(1, 'year').subtract(1, 'day');

            const isFullyTaken = i < 2; // Past years are taken

            await balanceRepo.save(balanceRepo.create({
                userId: user.id,
                periodStart: periodStart.toISOString(),
                periodEnd: periodEnd.toISOString(),
                concessiveLimitDate: periodEnd.add(1, 'year').toISOString(),
                daysVested: 30,
                daysTaken: isFullyTaken ? 30 : 0,
                daysSold: 0,
                balanceTotal: isFullyTaken ? 0 : 30
            }));

            if (isFullyTaken) {
                // Historical approved request
                await requestRepo.save(requestRepo.create({
                    userId: user.id,
                    startDate: periodEnd.add(1, 'month').format('YYYY-MM-DD'),
                    endDate: periodEnd.add(1, 'month').add(29, 'day').format('YYYY-MM-DD'),
                    // daysCount: 30, // Removed
                    status: VacationRequestStatus.APPROVED,
                    type: VacationType.INDIVIDUAL
                }));
            }
        }

        // --- 2. PERFORMANCE (360 & History) ---
        // Goals (2-3 per user)
        await goalRepo.save(goalRepo.create({
            userId: user.id,
            title: `Meta de Produtividade ${user.department}`,
            weight: 40,
            progress: 70 + (count % 30),
            type: GoalType.INDIVIDUAL
        }));

        await goalRepo.save(goalRepo.create({
            userId: user.id,
            title: 'Iuppy Culture & Values',
            weight: 20,
            progress: 100,
            type: GoalType.COMPANY
        }));

        const managerId = managerMap.get(user.id) || user.id;

        // PAST CYCLE (Closed 2024) - Full 360
        // 1. Manager Assessment
        const pastMgrForm = await formRepo.save(formRepo.create({
            cycleId: pastCycle.id,
            targetUserId: user.id,
            evaluatorUserId: managerId,
            type: AssessmentType.MANAGER,
            status: AssessmentStatus.SUBMITTED
        }));
        await answerRepo.save(answerRepo.create({
            formId: pastMgrForm.id,
            questionId: 'competency-tech',
            score: 3 + (count % 3),
            textAnswer: 'Demonstra bom conhecimento técnico no dia a dia.'
        }));

        // 2. Self Assessment
        const pastSelfForm = await formRepo.save(formRepo.create({
            cycleId: pastCycle.id,
            targetUserId: user.id,
            evaluatorUserId: user.id,
            type: AssessmentType.SELF,
            status: AssessmentStatus.SUBMITTED
        }));
        await answerRepo.save(answerRepo.create({
            formId: pastSelfForm.id,
            questionId: 'competency-tech',
            score: 4, // Self usually higher
            textAnswer: 'Acredito que entreguei acima do esperado.'
        }));

        // 3. Peer Assessment (Random Peer)
        const peer = users[(count + 5) % users.length];
        const pastPeerForm = await formRepo.save(formRepo.create({
            cycleId: pastCycle.id,
            targetUserId: user.id,
            evaluatorUserId: peer.id,
            type: AssessmentType.PEER,
            status: AssessmentStatus.SUBMITTED
        }));
        await answerRepo.save(answerRepo.create({
            formId: pastPeerForm.id,
            questionId: 'competency-teamwork',
            score: 5,
            textAnswer: 'Ótimo colega de trabalho, sempre ajuda.'
        }));

        // Calibration Result for Past Cycle
        await calibrationRepo.save(calibrationRepo.create({
            cycleId: pastCycle.id,
            userId: user.id,
            scoreX: (70 + (count % 30)),
            scoreY: 3 + (count % 3),
            quadrant: (count % 5 === 0) ? 'High-High' : 'Medium-Medium',
            justification: 'Profissional resiliente e focado em resultados.',
            calibratedAt: dayjs('2025-01-15').toDate(),
            calibratorId: managerId
        }));

        // ACTIVE CYCLE (2025) - Ongoing
        // Manager Drafts (30% of users have drafts)
        if (count % 3 === 0) {
            await formRepo.save(formRepo.create({
                cycleId: activeCycle.id,
                targetUserId: user.id,
                evaluatorUserId: managerId,
                type: AssessmentType.MANAGER,
                status: AssessmentStatus.PENDING
            }));
        }

        // --- 3. PDI (Action Plans) ---
        const pdi = await pdiRepo.save(pdiRepo.create({
            userId: user.id,
            title: `PDI - ${user.name}`,
            status: PDIStatus.IN_PROGRESS,
            deadline: dayjs().add(6, 'month').toISOString()
        }));

        // Completed Action
        await pdiActionRepo.save(pdiActionRepo.create({
            pdiId: pdi.id,
            description: 'Leitura do livro "High Output Management"',
            dueDate: dayjs().subtract(1, 'month').toISOString(),
            status: PDIStatus.COMPLETED
        }));

        // Ongoing Action
        await pdiActionRepo.save(pdiActionRepo.create({
            pdiId: pdi.id,
            description: 'Participar de Workshop de Liderança',
            dueDate: dayjs().add(2, 'month').toISOString(),
            status: PDIStatus.IN_PROGRESS
        }));

        // --- 4. ONE-ON-ONES (History) ---
        // Generate 4 quarterly meetings in 2024
        for (let q = 1; q <= 4; q++) {
            const date = dayjs('2024-01-15').add(q * 3, 'month').toDate();

            await oneOnOneRepo.save(oneOnOneRepo.create({
                companyId: user.companyId,
                organizerUserId: managerId,
                participantUserId: user.id,
                scheduledDate: date,
                status: OneOnOneStatus.COMPLETED,
                talkingPoints: [
                    { id: '1', text: 'Alinhamento de metas', checked: true, addedBy: managerId },
                    { id: '2', text: 'Feedback sobre projeto X', checked: true, addedBy: user.id }
                ],
                actionItems: [
                    { id: '1', text: 'Atualizar documentação', status: 'DONE' }
                ],
                privateNotes: 'Colaborador evoluindo bem.',
                createdAt: date,
                updatedAt: date
            }));
        }
    }

    console.log('✅ HR Data Seeding completed successfully.');
    await app.close();
}

bootstrap().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
