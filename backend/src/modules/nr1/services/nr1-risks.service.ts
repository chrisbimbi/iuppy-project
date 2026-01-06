import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1RiskRecord, RiskStatus, RiskLevel } from '../entities/nr1-risk-record.entity';
import { Nr1Version } from '../entities/nr1-version.entity';
import { Nr1RiskCriteria } from '../entities/nr1-risk-criteria.entity';

@Injectable()
export class Nr1RisksService {
    constructor(
        @InjectRepository(Nr1RiskRecord)
        private risksRepo: Repository<Nr1RiskRecord>,
        @InjectRepository(Nr1Version)
        private versionsRepo: Repository<Nr1Version>,
        @InjectRepository(Nr1RiskCriteria)
        private criteriaRepo: Repository<Nr1RiskCriteria>,
    ) { }

    async create(data: Partial<Nr1RiskRecord>): Promise<Nr1RiskRecord> {
        const risk = this.risksRepo.create(data);
        return this.risksRepo.save(risk);
    }

    async findAll(companyId: string, filters: any = {}): Promise<Nr1RiskRecord[]> {
        const query = this.risksRepo.createQueryBuilder('risk')
            .where('risk.company_id = :companyId', { companyId })
            .leftJoinAndSelect('risk.criterios', 'criterios');

        if (filters.spaceId) {
            query.andWhere('risk.space_id = :spaceId', { spaceId: filters.spaceId });
        }

        // Default to active risks unless specified
        if (filters.status) {
            query.andWhere('risk.status = :status', { status: filters.status });
        } else {
            query.andWhere('risk.status = :status', { status: RiskStatus.ATIVO });
        }

        return query.getMany();
    }

    async findOne(id: string): Promise<Nr1RiskRecord> {
        const risk = await this.risksRepo.findOne({
            where: { id },
            relations: ['criterios'],
        });
        if (!risk) throw new NotFoundException('Risk not found');
        return risk;
    }

    async update(id: string, updates: Partial<Nr1RiskRecord>): Promise<Nr1RiskRecord> {
        const risk = await this.findOne(id);
        Object.assign(risk, updates);
        return this.risksRepo.save(risk);
    }

    async delete(id: string): Promise<void> {
        // Soft delete by setting status to inactive
        await this.update(id, { status: RiskStatus.INATIVO });
    }

    async publishVersion(companyId: string, spaceId?: string): Promise<Nr1Version> {
        // 1. Fetch current active inventory
        const inventory = await this.findAll(companyId, { spaceId, status: RiskStatus.ATIVO });

        // 2. Fetch active criteria
        const criteria = await this.criteriaRepo.findOne({
            where: { company_id: companyId },
            order: { created_at: 'DESC' }
        });

        // 3. Create snapshot payload
        const snapshot = {
            generatedAt: new Date(),
            itemCount: inventory.length,
            criteriaVersion: criteria?.version,
            items: inventory,
        };

        // 4. Save to Version history (in real app, upload JSON to S3 and save URL)
        // For now, we simulate URL or store limited data meant for URL field if it was a real URL
        // Here we'll just store a placeholder 's3://...' 
        const version = this.versionsRepo.create({
            company_id: companyId,
            space_id: spaceId,
            snapshot_url: `s3://nr1-snapshots/${companyId}/${Date.now()}.json`, // Mock
        });

        return this.versionsRepo.save(version);
    }
}
