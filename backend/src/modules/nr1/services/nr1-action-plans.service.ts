import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1ActionPlan, ActionStatus } from '../entities/nr1-action-plan.entity';

@Injectable()
export class Nr1ActionPlansService {
    constructor(
        @InjectRepository(Nr1ActionPlan)
        private actionsRepo: Repository<Nr1ActionPlan>,
    ) { }

    async create(data: Partial<Nr1ActionPlan>): Promise<Nr1ActionPlan> {
        const action = this.actionsRepo.create(data);
        return this.actionsRepo.save(action);
    }

    async findAllByRisk(riskId: string): Promise<Nr1ActionPlan[]> {
        return this.actionsRepo.find({
            where: { risk_id: riskId },
            order: { created_at: 'DESC' },
        });
    }

    async findAllByCompany(companyId: string, filters: any = {}): Promise<Nr1ActionPlan[]> {
        const query = this.actionsRepo.createQueryBuilder('action')
            .leftJoinAndSelect('action.risk', 'risk')
            .where('risk.company_id = :companyId', { companyId });

        if (filters.status) {
            query.andWhere('action.status = :status', { status: filters.status });
        }
        if (filters.responsavelId) {
            query.andWhere('action.responsavel_id = :responsavelId', { responsavelId: filters.responsavelId });
        }

        return query.getMany();
    }

    async update(id: string, updates: Partial<Nr1ActionPlan>): Promise<Nr1ActionPlan> {
        const action = await this.actionsRepo.findOne({ where: { id } });
        if (!action) throw new NotFoundException('Action Plan not found');

        Object.assign(action, updates);
        return this.actionsRepo.save(action);
    }
}
