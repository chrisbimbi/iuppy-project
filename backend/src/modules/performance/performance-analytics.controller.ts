import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentFormEntity } from './entities/assessment-form.entity';

@Controller('performance/analytics')
export class PerformanceAnalyticsController {
    constructor(
        @InjectRepository(AssessmentFormEntity)
        private readonly formRepo: Repository<AssessmentFormEntity>,
    ) { }

    @Get('9box-distribution')
    async get9BoxDistribution() {
        // In real implementation, group by calculated box (1-9)
        // Mock data for demo
        return [
            { box: 1, label: 'Enigma', count: 5 },
            { box: 2, label: 'Forte Desempenho', count: 12 },
            { box: 3, label: 'Alto Potencial', count: 8 },
            { box: 5, label: 'Mantenedor', count: 20 },
            { box: 9, label: 'Talento', count: 3 },
        ];
    }

    @Get('competencies-radar')
    async getCompetenciesRadar() {
        // Mock average scores
        return [
            { competence: 'Comunicação', score: 4.2 },
            { competence: 'Liderança', score: 3.5 },
            { competence: 'Técnica', score: 4.8 },
            { competence: 'Resiliência', score: 3.9 },
            { competence: 'Proatividade', score: 4.0 },
        ];
    }
}
