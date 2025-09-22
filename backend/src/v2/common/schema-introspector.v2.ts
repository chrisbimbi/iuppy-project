import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'

type EventMap = {
  table: 'news_interaction_event' | 'interaction_event'
  typeCol: 'type' | 'event'
  newsIdCol: 'newsId' | 'objectId'
  userIdCol: 'userId'
  createdAtCol: 'createdAt' | 'created_at'
}

type CommentMap = {
  table: 'news_comment'
  approvedCol?: 'approved'
  statusCol?: 'status'
  createdAtCol: 'createdAt' | 'created_at'
}

@Injectable()
export class SchemaIntrospectorV2 {
  private readonly logger = new Logger(SchemaIntrospectorV2.name)
  constructor(private readonly ds: DataSource) {}

  // ——— low-level helpers
  private async tableExistsRaw(table: string): Promise<boolean> {
    const q = `SELECT to_regclass($1) IS NOT NULL AS exists`
    const r = await this.ds.query(q, [`public.${table}`])
    return !!r?.[0]?.exists
  }
  private async columnExistsRaw(table: string, column: string): Promise<boolean> {
    const q = `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name = $1 AND column_name = $2
      LIMIT 1`
    const r = await this.ds.query(q, [table, column])
    return r.length > 0
  }

  // ——— public aliases (compat com código legado)
  async hasTable(table: string): Promise<boolean> {
    return this.tableExistsRaw(table)
  }
  async hasColumn(table: string, column: string): Promise<boolean> {
    return this.columnExistsRaw(table, column)
  }

  /** Detecta tabela/colunas de eventos OPEN/ACK (variações de schema) */
  async detectEventMap(): Promise<EventMap | null> {
    const candidates = ['news_interaction_event', 'interaction_event'] as const
    for (const table of candidates) {
      if (!(await this.tableExistsRaw(table))) continue
      const typeCol =
        (await this.columnExistsRaw(table, 'type')) ? 'type'
        : (await this.columnExistsRaw(table, 'event')) ? 'event'
        : null
      if (!typeCol) continue

      const newsIdCol =
        (await this.columnExistsRaw(table, 'newsId')) ? 'newsId'
        : (await this.columnExistsRaw(table, 'objectId')) ? 'objectId'
        : null
      if (!newsIdCol) continue

      const createdAtCol =
        (await this.columnExistsRaw(table, 'createdAt')) ? 'createdAt'
        : (await this.columnExistsRaw(table, 'created_at')) ? 'created_at'
        : null
      if (!createdAtCol) continue

      // userId é obrigatório nos dois esquemas que vimos
      if (!(await this.columnExistsRaw(table, 'userId'))) continue

      return { table, typeCol: typeCol as EventMap['typeCol'], newsIdCol: newsIdCol as EventMap['newsIdCol'], userIdCol: 'userId', createdAtCol: createdAtCol as EventMap['createdAtCol'] }
    }
    this.logger.warn('Nenhuma tabela de eventos detectada')
    return null
  }

  /** Alias p/ compat com chamadas antigas */
  async detectInteractionEvent(): Promise<EventMap | null> {
    return this.detectEventMap()
  }

  /** Detecta se comentários usam status (approved/rejected) ou boolean approved */
  async detectCommentMap(): Promise<CommentMap | null> {
    const table = 'news_comment'
    if (!(await this.tableExistsRaw(table))) return null
    const approvedCol = (await this.columnExistsRaw(table, 'approved')) ? 'approved' : undefined
    const statusCol = !approvedCol && (await this.columnExistsRaw(table, 'status')) ? 'status' : undefined
    const createdAtCol =
      (await this.columnExistsRaw(table, 'createdAt')) ? 'createdAt'
      : (await this.columnExistsRaw(table, 'created_at')) ? 'created_at'
      : 'createdAt'
    return { table, approvedCol, statusCol, createdAtCol }
  }

  /** Retorna o MAX(createdAt) entre tabelas relevantes para compor ETag */
  async getLastUpdateMarker(companyId: string, fromISO?: string, toISO?: string): Promise<string> {
    const pieces: Date[] = []
    const addMax = async (sql: string, params: any[]) => {
      const r = await this.ds.query(sql, params)
      const d = (r?.[0]?.max ?? r?.[0]?.MAX ?? null) as string | null
      if (d) pieces.push(new Date(d))
    }

    const rangeFrag = (col: string) => [
      fromISO ? `AND ${col} >= $2` : '',
      toISO   ? `AND ${col} <  $${fromISO ? 3 : 2}` : '',
    ].filter(Boolean).join('\n')

    // 1) Eventos (OPEN/ACK)
    const ev = await this.detectEventMap()
    if (ev) {
      const sql = `
        SELECT MAX(${ev.createdAtCol}) AS max
        FROM ${ev.table}
        WHERE "companyId" = $1
        ${fromISO || toISO ? rangeFrag(ev.createdAtCol) : ''}
      `
      await addMax(sql, [companyId, ...(fromISO ? [fromISO] : []), ...(toISO ? [toISO] : [])])
    }

    // 2) Reactions
    if (await this.tableExistsRaw('news_reaction')) {
      const hasCreatedAt = await this.columnExistsRaw('news_reaction', 'createdAt')
      const col = hasCreatedAt ? 'createdAt' : 'created_at'
      const sql = `
        SELECT MAX(${col}) AS max
        FROM news_reaction
        WHERE "companyId" = $1
        ${fromISO || toISO ? rangeFrag(col) : ''}
      `
      await addMax(sql, [companyId, ...(fromISO ? [fromISO] : []), ...(toISO ? [toISO] : [])])
    }

    // 3) Comments
    const cm = await this.detectCommentMap()
    if (cm) {
      const sql = `
        SELECT MAX(${cm.createdAtCol}) AS max
        FROM ${cm.table}
        WHERE "companyId" = $1
        ${fromISO || toISO ? rangeFrag(cm.createdAtCol) : ''}
      `
      await addMax(sql, [companyId, ...(fromISO ? [fromISO] : []), ...(toISO ? [toISO] : [])])
    }

    // 4) Push delivery
    if (await this.tableExistsRaw('push_delivery')) {
      const hasDelivered = await this.columnExistsRaw('push_delivery', 'deliveredAt')
      const col = hasDelivered ? 'deliveredAt' : 'createdAt'
      const sql = `
        SELECT MAX(${col}) AS max
        FROM push_delivery
        WHERE "companyId" = $1
        ${fromISO || toISO ? rangeFrag(col) : ''}
      `
      await addMax(sql, [companyId, ...(fromISO ? [fromISO] : []), ...(toISO ? [toISO] : [])])
    }

    const max = pieces.length ? new Date(Math.max(...pieces.map(d => d.getTime()))) : new Date(0)
    return max.toISOString()
  }
}
