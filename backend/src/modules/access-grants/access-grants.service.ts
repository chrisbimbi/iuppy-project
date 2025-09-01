import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AccessGrantEntity } from './access-grant.entity'
import { UpsertAccessGrantDto } from './dto/upsert-access-grant.dto'

@Injectable()
export class AccessGrantsService {
    constructor(
        @InjectRepository(AccessGrantEntity)
        private repo: Repository<AccessGrantEntity>,
    ) { }

    async list(companyId: string, userId?: string) {
        return this.repo.find({
            where: { companyId, ...(userId ? { userId } : {}) },
            order: { updatedAt: 'DESC' }
        })
    }

    async upsert(companyId: string, dto: UpsertAccessGrantDto) {
        const { userId, moduleKey } = dto
        let row = await this.repo.findOne({ where: { companyId, userId, moduleKey } })
        if (!row) row = this.repo.create({ companyId, userId, moduleKey })

        row.scopeType = dto.scopeType
        row.spaceIds = dto.scopeType === 'SPACE_IDS' ? (dto.spaceIds ?? []) : null
        row.canView = dto.canView
        row.canEdit = dto.canEdit
        row.canManage = dto.canManage
        row.updatedAt = new Date()

        return this.repo.save(row)
    }

    async remove(companyId: string, id: string) {
        const row = await this.repo.findOne({ where: { id, companyId } })
        if (!row) return { affected: 0 }
        await this.repo.remove(row)
        return { affected: 1 }
    }
}