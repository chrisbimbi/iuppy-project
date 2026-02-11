import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1RiskType } from '../entities/nr1-risk-type.entity';

@Injectable()
export class Nr1RiskTypesService {
    constructor(
        @InjectRepository(Nr1RiskType)
        private repo: Repository<Nr1RiskType>,
    ) { }

    async create(companyId: string, data: Partial<Nr1RiskType>): Promise<Nr1RiskType> {
        const item = this.repo.create({ ...data, company_id: companyId });
        return this.repo.save(item);
    }

    async findAll(companyId: string): Promise<Nr1RiskType[]> {
        return this.repo.find({
            where: { company_id: companyId, active: true },
            order: { name: 'ASC' }
        });
    }

    async update(id: string, updates: Partial<Nr1RiskType>): Promise<Nr1RiskType> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Risk Type not found');
        Object.assign(item, updates);
        return this.repo.save(item);
    }

    async delete(id: string): Promise<void> {
        // Soft delete or hard delete? Entity has 'active', let's soft delete.
        await this.repo.update(id, { active: false });
    }
}
