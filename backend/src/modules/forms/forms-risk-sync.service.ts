import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormAnswerEntity } from './entities/form-answer.entity';
import { FormFieldEntity } from './entities/form-field.entity';
import { FormEntity } from './entities/form.entity';
import { Nr1RisksService } from '../nr1/services/nr1-risks.service';
import { RiskStatus } from '../nr1/entities/nr1-risk-record.entity';

@Injectable()
export class FormsRiskSyncService {
    private readonly log = new Logger(FormsRiskSyncService.name);

    constructor(
        @InjectRepository(FormAnswerEntity)
        private readonly ansRepo: Repository<FormAnswerEntity>,
        @InjectRepository(FormFieldEntity)
        private readonly fieldRepo: Repository<FormFieldEntity>,
        @InjectRepository(FormEntity)
        private readonly formRepo: Repository<FormEntity>,
        private readonly nr1RisksService: Nr1RisksService,
    ) { }

    async syncSubmission(submissionId: string) {
        try {
            // 1. Get submission's form info via answers (simplest path given relations)
            const answers = await this.ansRepo.find({ where: { submissionId } });
            if (answers.length === 0) return;

            const formId = answers[0].formId;
            const form = await this.formRepo.findOne({ where: { id: formId } });

            // Strict check on template
            if (!form || form.template !== 'nr1_risk_reporting') return;

            // 2. Map fields
            const fields = await this.fieldRepo.find({
                where: { formId, version: form.version },
            });

            const riskData: any = {
                company_id: form.companyId,
                status: RiskStatus.ATIVO,
            };

            for (const ans of answers) {
                const field = fields.find(f => f.id === ans.fieldId);
                if (!field) continue;

                const label = this.getLabel(field.label).toLowerCase();

                if (label.includes('processo')) riskData.processo = String(ans.value);
                if (label.includes('ambiente')) riskData.ambiente = String(ans.value);
                if (label.includes('perigo')) riskData.perigo = String(ans.value);
                if (label.includes('probabilidade')) riskData.probabilidade = Number(ans.value);
                if (label.includes('severidade')) riskData.severidade = Number(ans.value);
            }

            // Calculate Classification logic (mirrored from frontend)
            const p = riskData.probabilidade || 0;
            const s = riskData.severidade || 0;
            const score = p * s;
            let level = 'b';
            if (score > 5) level = 'm';
            if (score > 10) level = 'a';
            if (score > 16) level = 'ma';

            riskData.classificacao_risco = level;

            // 3. Create Risk
            await this.nr1RisksService.create(riskData);
            this.log.log(`[Sync] Risk created from submission ${submissionId}`);

        } catch (e) {
            this.log.error(`Failed to sync submission ${submissionId} to risk: ${e}`);
        }
    }

    private getLabel(label: any): string {
        if (typeof label === 'string') return label;
        return label?.['pt-BR'] || Object.values(label || {})[0] || '';
    }
}
