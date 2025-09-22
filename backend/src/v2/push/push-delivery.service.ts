import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

export type PushStatus = 'SENT' | 'DELIVERED' | 'FAILED'

@Injectable()
export class PushDeliveryServiceV2 {
    constructor(private readonly ds: DataSource) { }

    async recordDelivery(companyId: string, newsId: string, userId: string, providerMsgId: string, status: PushStatus, deliveredAt?: Date) {
        const sql = `
      INSERT INTO push_delivery ("companyId","newsId","userId","providerMsgId","status","deliveredAt")
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT ("companyId","newsId","userId") DO UPDATE
      SET "status"=$5, "deliveredAt"=COALESCE($6, push_delivery."deliveredAt")
    `
        await this.ds.query(sql, [companyId, newsId, userId, providerMsgId, status, deliveredAt ?? null])
    }
}