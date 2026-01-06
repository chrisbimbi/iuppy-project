import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Nr1RiskRecord } from '../entities/nr1-risk-record.entity';
import { Nr1ActionPlan } from '../entities/nr1-action-plan.entity';
import { FormEntity } from '../../forms/entities/form.entity';
import { FormSubmissionEntity } from '../../forms/entities/form-submission.entity';

@Injectable()
export class Nr1ParticipationService {
    constructor(
        @InjectRepository(FormEntity)
        private formRepo: Repository<FormEntity>,
        @InjectRepository(FormSubmissionEntity)
        private subRepo: Repository<FormSubmissionEntity>,
        @InjectRepository(Nr1RiskRecord)
        private riskRepo: Repository<Nr1RiskRecord>,
        @InjectRepository(Nr1ActionPlan)
        private actionRepo: Repository<Nr1ActionPlan>,
    ) { }

    async listNr1Submissions(companyId: string, template: string) {
        // 1. Find forms with this template
        const forms = await this.formRepo.find({
            where: { companyId, template },
            select: ['id', 'title'],
        });

        if (forms.length === 0) return [];

        const formIds = forms.map((f) => f.id);

        // 2. Find submissions for these forms
        const submissions = await this.subRepo.find({
            where: { companyId, formId: In(formIds) },
            order: { submittedAt: 'DESC' },
            relations: ['answers'], // We might need answers to show data preview
            take: 100, // Limit for safety
        });

        return submissions.map(s => ({
            ...s,
            formTitle: forms.find(f => f.id === s.formId)?.title
        }));
    }

    async convertToRisk(
        companyId: string,
        submissionId: string,
        riskData: Partial<Nr1RiskRecord>
    ): Promise<Nr1RiskRecord> {
        // Verify submission exists
        const sub = await this.subRepo.findOne({ where: { id: submissionId, companyId } });
        if (!sub) throw new Error('Submission not found');

        // Create risk
        const risk = this.riskRepo.create({
            ...riskData,
            company_id: companyId,
            // We could link back to submission if we had a column, or just note it in description
            fonte_circunstancia: `${riskData.fonte_circunstancia || ''} (Origem: Relato ID ${submissionId})`
        });

        return this.riskRepo.save(risk);
    }

    async convertToAction(
        companyId: string,
        submissionId: string,
        riskId: string,
        actionData: Partial<Nr1ActionPlan>
    ): Promise<Nr1ActionPlan> {
        const sub = await this.subRepo.findOne({ where: { id: submissionId, companyId } });
        if (!sub) throw new Error('Submission not found');

        const action = this.actionRepo.create({
            ...actionData,
            risk_id: riskId,
            medida_prevencao: `${actionData.medida_prevencao || ''} (Origem: Relato ID ${submissionId})`
        });

        return this.actionRepo.save(action);
    }
}
