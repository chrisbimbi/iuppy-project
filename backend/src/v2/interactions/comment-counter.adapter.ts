// src/v2/interactions/comment-counter.adapter.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentCounterAdapterV2 {
  constructor(private readonly ds: DataSource) {}

  private async hasTable(name: string) {
    const r = await this.ds.query(`SELECT to_regclass($1) AS t`, [`public.${name}`]);
    return !!(r?.[0]?.t);
  }
  private async hasColumn(table: string, col: string) {
    const r = await this.ds.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
      [table, col],
    );
    return !!r?.length;
  }

  async countApprovedForNews(companyId: string, newsId: string): Promise<number> {
    if (!(await this.hasTable('news_comment'))) return 0;
    // autodetecta modelo: approved:boolean OU status:'APPROVED'
    const hasApproved = await this.hasColumn('news_comment', 'approved');
    if (hasApproved) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c FROM news_comment WHERE "companyId"=$1 AND "newsId"=$2 AND "approved"=true`,
        [companyId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }
    const hasStatus = await this.hasColumn('news_comment', 'status');
    if (hasStatus) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c FROM news_comment WHERE "companyId"=$1 AND "newsId"=$2 AND "status"='APPROVED'`,
        [companyId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }
    return 0;
  }

  async countApprovedByUserForNews(companyId: string, userId: string, newsId: string): Promise<number> {
    if (!(await this.hasTable('news_comment'))) return 0;
    const hasApproved = await this.hasColumn('news_comment', 'approved');
    if (hasApproved) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c FROM news_comment WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3 AND "approved"=true`,
        [companyId, userId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }
    const hasStatus = await this.hasColumn('news_comment', 'status');
    if (hasStatus) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c FROM news_comment WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3 AND "status"='APPROVED'`,
        [companyId, userId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }
    return 0;
  }
}