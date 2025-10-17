import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

@Injectable()
export class CommentCounterAdapterV2 {
  constructor(
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private async hasTable(name: string) {
    return this.schema.hasTable(name);
  }
  private async hasColumn(table: string, col: string) {
    return this.schema.hasColumn(table, col);
  }

  /** Total de comentários aprovados para a news */
  async countApprovedForNews(companyId: string, newsId: string): Promise<number> {
    if (!(await this.hasTable('news_comment'))) return 0;

    const hasApproved = await this.hasColumn('news_comment', 'approved');
    if (hasApproved) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM news_comment
          WHERE "companyId"=$1 AND "newsId"=$2 AND "approved"=true`,
        [companyId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }

    const hasStatus = await this.hasColumn('news_comment', 'status');
    if (hasStatus) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM news_comment
          WHERE "companyId"=$1 AND "newsId"=$2 AND "status" IN ('APPROVED','approved')`,
        [companyId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }

    return 0;
  }

  /** Total de comentários aprovados do usuário X na news */
  async countApprovedByUserForNews(companyId: string, userId: string, newsId: string): Promise<number> {
    if (!(await this.hasTable('news_comment'))) return 0;

    const hasApproved = await this.hasColumn('news_comment', 'approved');
    if (hasApproved) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM news_comment
          WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3 AND "approved"=true`,
        [companyId, userId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }

    const hasStatus = await this.hasColumn('news_comment', 'status');
    if (hasStatus) {
      const r = await this.ds.query(
        `SELECT COUNT(*)::int AS c
           FROM news_comment
          WHERE "companyId"=$1 AND "userId"=$2 AND "newsId"=$3 AND "status" IN ('APPROVED','approved')`,
        [companyId, userId, newsId],
      );
      return r?.[0]?.c ?? 0;
    }

    return 0;
  }
}