// src/v2/common/schema-introspector.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaIntrospectorV2 {
  constructor(private readonly ds: DataSource) {}

  async hasTable(table: string): Promise<boolean> {
    const r = await this.ds.query(`SELECT to_regclass($1) AS t`, [`public.${table}`]);
    return !!(r && r[0] && r[0].t);
  }

  async hasColumn(table: string, column: string): Promise<boolean> {
    const r = await this.ds.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
      [table, column],
    );
    return !!(r && r.length);
  }

  async detectInteractionEvent(): Promise<{
    table: string; typeCol: string; newsRef: string; userIdCol: string; createdAtCol: string;
  } | null> {
    const r = await this.ds.query(
      `SELECT to_regclass('public.news_interaction_event') AS nie, to_regclass('public.interaction_event') AS ie`,
    );
    const table =
      (r && r[0] && r[0].nie && 'news_interaction_event') ||
      (r && r[0] && r[0].ie && 'interaction_event') ||
      null;
    if (!table) return null;

    const cols = await this.ds.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table],
    );
    const names: string[] = (cols || []).map((c: any) => c.column_name);
    const typeCol = names.includes('type') ? 'type' : names.includes('event') ? 'event' : null;
    const newsRef = names.includes('newsId') ? 'newsId' : names.includes('objectId') ? 'objectId' : null;
    const userIdCol = names.includes('userId') ? 'userId' : null;
    const createdAtCol = names.includes('createdAt') ? 'createdAt' : null;
    if (!typeCol || !newsRef || !userIdCol || !createdAtCol) return null;
    return { table, typeCol, newsRef, userIdCol, createdAtCol };
  }
}