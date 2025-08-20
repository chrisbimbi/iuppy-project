import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CompanyModuleEntity } from './company-module.entity'
import { CompanyModule, ModuleKey } from '@shared/types'

@Injectable()
export class CompanyModulesService {
    constructor(
        @InjectRepository(CompanyModuleEntity)
        private repo: Repository<CompanyModuleEntity>,
    ) { }

    async list(companyId: string): Promise<CompanyModule[]> {
        const rows = await this.repo.find({ where: { companyId } })
        return rows.map(this.map)
    }

    async get(companyId: string, key: ModuleKey): Promise<CompanyModule | null> {
        const row = await this.repo.findOne({ where: { companyId, key } })
        return row ? this.map(row) : null
    }

    async upsert(companyId: string, key: ModuleKey, enabled: boolean, config?: Record<string, any>): Promise<CompanyModule> {
        let row = await this.repo.findOne({ where: { companyId, key } })
        if (!row) row = this.repo.create({ companyId, key, enabled, config: config ?? null })
        else { row.enabled = enabled; row.config = config ?? null; row.updatedAt = new Date() }
        return this.map(await this.repo.save(row))
    }

    private map = (e: CompanyModuleEntity): CompanyModule => ({
        companyId: e.companyId,
        key: e.key as ModuleKey,
        enabled: e.enabled,
        config: e.config ?? undefined,
        updatedAt: e.updatedAt,
    })
}