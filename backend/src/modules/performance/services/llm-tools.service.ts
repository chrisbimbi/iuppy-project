
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LlmToolsService {
    private readonly logger = new Logger(LlmToolsService.name);

    /**
     * Rewrite raw feedback to be more professional and constructive using LLM.
     */
    async rewriteFeedback(rawText: string): Promise<string> {
        this.logger.log('Rewriting feedback using LLM...');
        // Mock LLM call
        await new Promise(r => setTimeout(r, 800));

        return `[AI REWRITTEN] ${rawText.replace(/ruim|péssimo/g, 'com oportunidades de melhoria').toUpperCase()}`;
    }

    /**
     * Generate a PDI (Individual Development Plan) based on current and target roles.
     */
    async generatePdi(currentRole: string, targetRole: string): Promise<{ actions: string[], courses: string[] }> {
        this.logger.log(`Generating PDI: ${currentRole} -> ${targetRole}`);
        // Mock LLM call

        return {
            actions: [
                'Liderar um projeto pequeno por 3 meses',
                'Mentoria com Senior do time',
                'Apresentar Tech Talk sobre arquitetura'
            ],
            courses: [
                'Fundamentos de Liderança (Journey)',
                'Arquitetura de Software Avançada',
                'Comunicação Não-Violenta'
            ]
        };
    }
}
