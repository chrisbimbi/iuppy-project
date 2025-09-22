import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2'

@Injectable()
export class CommentCounterAdapterV2 {
  constructor(
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2
  ) {}

  /** Total de comentários aprovados para uma news */
  async countApproved(companyId: string, newsId: string): Promise<number> {
    const map = await this.schema.detectCommentMap()
    if (!map) return 0

    if (map.approvedCol) {
      const sql = `
        SELECT COUNT(*)::int AS c
        FROM ${map.table}
        WHERE "companyId" = $1 AND "newsId" = $2 AND "${map.approvedCol}" = true
      `
      const r = await this.ds.query(sql, [companyId, newsId])
      return r?.[0]?.c ?? 0
    }

    // status
    const sql = `
      SELECT COUNT(*)::int AS c
      FROM ${map.table}
      WHERE "companyId" = $1 AND "newsId" = $2 AND "${map.statusCol}" IN ('APPROVED','approved')
    `
    const r = await this.ds.query(sql, [companyId, newsId])
    return r?.[0]?.c ?? 0
  }

  /** Alias p/ compat com chamadas existentes */
  async countApprovedForNews(companyId: string, newsId: string): Promise<number> {
    return this.countApproved(companyId, newsId)
  }

  /** Total de comentários aprovados do usuário X na news */
  async countApprovedByUserForNews(companyId: string, userId: string, newsId: string): Promise<number> {
    const map = await this.schema.detectCommentMap()
    if (!map) return 0

    if (map.approvedCol) {
      const sql = `
        SELECT COUNT(*)::int AS c
        FROM ${map.table}
        WHERE "companyId" = $1 AND "userId" = $2 AND "newsId" = $3 AND "${map.approvedCol}" = true
      `
      const r = await this.ds.query(sql, [companyId, userId, newsId])
      return r?.[0]?.c ?? 0
    }

    const sql = `
      SELECT COUNT(*)::int AS c
      FROM ${map.table}
      WHERE "companyId" = $1 AND "userId" = $2 AND "newsId" = $3 AND "${map.statusCol}" IN ('APPROVED','approved')
    `
    const r = await this.ds.query(sql, [companyId, userId, newsId])
    return r?.[0]?.c ?? 0
  }
}
  