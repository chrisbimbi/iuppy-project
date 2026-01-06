import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

type EventMap = {
  table: 'news_interaction_event' | 'interaction_event';
  typeCol: 'type' | 'event';
  newsIdCol: 'newsId' | 'objectId';
  userIdCol: 'userId';
  createdAtCol: 'createdAt' | 'created_at';
};

type CommentMap = {
  table: 'news_comment';
  approvedCol?: 'approved';
  statusCol?: 'status';
  createdAtCol: 'createdAt' | 'created_at';
};

@Injectable()
export class SchemaIntrospectorV2 {
  private readonly logger = new Logger(SchemaIntrospectorV2.name);
  constructor(private readonly ds: DataSource) {}

  // ────────────────────────────────────────────────────────────────────────────
  // helpers de quoting / introspecção
  // ────────────────────────────────────────────────────────────────────────────
  /** Escapa identificadores (tabela/coluna) para Postgres */
  private q(ident: string) {
    return `"${ident.replace(/"/g, '""')}"`;
  }

  private async tableExistsRaw(table: string): Promise<boolean> {
    const q = `SELECT to_regclass($1) IS NOT NULL AS exists`;
    const r = await this.ds.query(q, [`public.${table}`]);
    return !!r?.[0]?.exists;
  }

  private async columnExistsRaw(
    table: string,
    column: string,
  ): Promise<boolean> {
    const q = `
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema='public' AND table_name = $1 AND column_name = $2
       LIMIT 1`;
    const r = await this.ds.query(q, [table, column]);
    return r.length > 0;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // aliases públicos (compat legado)
  // ────────────────────────────────────────────────────────────────────────────
  async hasTable(table: string): Promise<boolean> {
    return this.tableExistsRaw(table);
  }
  async hasColumn(table: string, column: string): Promise<boolean> {
    return this.columnExistsRaw(table, column);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // detecção de esquemas (variações)
  // ────────────────────────────────────────────────────────────────────────────
  /** Detecta tabela/colunas de eventos OPEN/ACK (variações de schema) */
  async detectEventMap(): Promise<EventMap | null> {
    const candidates = ['news_interaction_event', 'interaction_event'] as const;
    for (const table of candidates) {
      if (!(await this.tableExistsRaw(table))) continue;

      const typeCol = (await this.columnExistsRaw(table, 'type'))
        ? 'type'
        : (await this.columnExistsRaw(table, 'event'))
          ? 'event'
          : null;
      if (!typeCol) continue;

      const newsIdCol = (await this.columnExistsRaw(table, 'newsId'))
        ? 'newsId'
        : (await this.columnExistsRaw(table, 'objectId'))
          ? 'objectId'
          : null;
      if (!newsIdCol) continue;

      const createdAtCol = (await this.columnExistsRaw(table, 'createdAt'))
        ? 'createdAt'
        : (await this.columnExistsRaw(table, 'created_at'))
          ? 'created_at'
          : null;
      if (!createdAtCol) continue;

      if (!(await this.columnExistsRaw(table, 'userId'))) continue;

      return {
        table,
        typeCol: typeCol as EventMap['typeCol'],
        newsIdCol: newsIdCol as EventMap['newsIdCol'],
        userIdCol: 'userId',
        createdAtCol: createdAtCol as EventMap['createdAtCol'],
      };
    }
    this.logger.warn('Nenhuma tabela de eventos detectada');
    return null;
  }

  /** Alias p/ compat com chamadas antigas */
  async detectInteractionEvent(): Promise<EventMap | null> {
    return this.detectEventMap();
  }

  /** Detecta se comentários usam status (approved/rejected) ou boolean approved */
  async detectCommentMap(): Promise<CommentMap | null> {
    const table = 'news_comment';
    if (!(await this.tableExistsRaw(table))) return null;
    const approvedCol = (await this.columnExistsRaw(table, 'approved'))
      ? 'approved'
      : undefined;
    const statusCol =
      !approvedCol && (await this.columnExistsRaw(table, 'status'))
        ? 'status'
        : undefined;
    const createdAtCol = (await this.columnExistsRaw(table, 'createdAt'))
      ? 'createdAt'
      : (await this.columnExistsRaw(table, 'created_at'))
        ? 'created_at'
        : 'createdAt';
    return { table, approvedCol, statusCol, createdAtCol };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ETag marker
  // ────────────────────────────────────────────────────────────────────────────
  /** Retorna o maior "instante de update" observado para compor ETag dos endpoints */
  async getLastUpdateMarker(
    companyId: string,
    fromISO?: string,
    toISO?: string,
  ): Promise<string> {
    const pieces: Date[] = [];

    // helper: executa uma query MAX() e agrega ao marcador
    const addMax = async (
      table: string,
      createdAtCol: string,
      { withCompanyId = false }: { withCompanyId?: boolean } = {},
    ) => {
      const t = this.q(table);
      const c = this.q(createdAtCol);

      let sql = `SELECT MAX(${c}) AS max FROM ${t}`;
      const params: any[] = [];

      if (withCompanyId) {
        const company = this.q('companyId');
        sql += ` WHERE ${company} = $1`;
        params.push(companyId);
      }

      // range opcional (>= from, < to+1d)
      const addRange = (baseIndex: number) => {
        let idx = baseIndex;
        if (fromISO) {
          sql += params.length
            ? ` AND ${c} >= $${idx}`
            : ` WHERE ${c} >= $${idx}`;
          params.push(fromISO);
          idx++;
        }
        if (toISO) {
          sql += params.length
            ? ` AND ${c} < ($${idx}::date + INTERVAL '1 day')`
            : ` WHERE ${c} < ($${idx}::date + INTERVAL '1 day')`;
          params.push(toISO);
          idx++;
        }
        return idx;
      };

      addRange(params.length + 1);

      const r = await this.ds.query(sql, params);
      const d = (r?.[0]?.max ?? null) as string | null;
      if (d) pieces.push(new Date(d));
    };

    // 1) Eventos (OPEN/ACK) — tabela variável
    const ev = await this.detectEventMap();
    if (ev) await addMax(ev.table, ev.createdAtCol, { withCompanyId: true });

    // 2) Reactions
    if (await this.tableExistsRaw('news_reaction')) {
      const col = (await this.columnExistsRaw('news_reaction', 'createdAt'))
        ? 'createdAt'
        : 'created_at';
      await addMax('news_reaction', col, { withCompanyId: true });
    }

    // 3) Comments
    const cm = await this.detectCommentMap();
    if (cm) await addMax(cm.table, cm.createdAtCol, { withCompanyId: true });

    // 4) Push delivery
    if (await this.tableExistsRaw('push_delivery')) {
      const hasDelivered = await this.columnExistsRaw(
        'push_delivery',
        'deliveredAt',
      );
      const col = hasDelivered ? 'deliveredAt' : 'createdAt';
      await addMax('push_delivery', col, { withCompanyId: true });
    }

    // 5) Atualização de notícias em si (caso editem conteúdo)
    if (
      (await this.tableExistsRaw('news_entity')) &&
      (await this.columnExistsRaw('news_entity', 'updatedAt'))
    ) {
      await addMax('news_entity', 'updatedAt', { withCompanyId: true });
    }

    // 6) Métricas diárias (pode não ter companyId; usamos apenas o range)
    if (
      (await this.tableExistsRaw('news_metrics_daily')) &&
      (await this.columnExistsRaw('news_metrics_daily', 'date'))
    ) {
      await addMax('news_metrics_daily', 'date', { withCompanyId: false });
    }

    const max = pieces.length
      ? new Date(Math.max(...pieces.map((d) => d.getTime())))
      : new Date(0);
    return max.toISOString();
  }
}
