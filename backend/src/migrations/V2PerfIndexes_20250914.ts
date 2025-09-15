// src/migrations/V2PerfIndexes_20250914.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2PerfIndexes_20250914_1200 implements MigrationInterface {
  name = 'V2PerfIndexes_20250914_1200';

  private async reg(qr: QueryRunner, name: string): Promise<boolean> {
    const r = await qr.query(`SELECT to_regclass($1) AS t`, [name]);
    return !!r?.[0]?.t;
  }

  private async col(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const r = await qr.query(
      `SELECT 1
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        LIMIT 1`,
      [table, column],
    );
    return r.length > 0;
  }

  private async ensureIndex(qr: QueryRunner, indexName: string, createSql: string) {
    const exists = await this.reg(qr, `public.${indexName}`);
    if (!exists) {
      await qr.query(createSql);
    }
  }

  public async up(qr: QueryRunner): Promise<void> {
    const hasNIE = await this.reg(qr, 'public.news_interaction_event');
    const hasIE  = await this.reg(qr, 'public.interaction_event');

    // -----------------------------
    // news_interaction_event (modelo novo: companyId, newsId, userId, type, createdAt)
    // -----------------------------
    if (hasNIE) {
      const hasCompanyId = await this.col(qr, 'news_interaction_event', 'companyId');
      const hasNewsId    = await this.col(qr, 'news_interaction_event', 'newsId');
      const hasUserId    = await this.col(qr, 'news_interaction_event', 'userId');
      const hasType      = await this.col(qr, 'news_interaction_event', 'type');
      const hasCreatedAt = await this.col(qr, 'news_interaction_event', 'createdAt');

      if (hasCompanyId && hasNewsId && hasUserId && hasType) {
        await this.ensureIndex(
          qr,
          'idx_nie_company_news_user_type',
          `CREATE INDEX idx_nie_company_news_user_type
             ON "news_interaction_event"("companyId","newsId","userId","type")`,
        );
      }

      if (hasCompanyId && hasNewsId && hasType && hasCreatedAt) {
        await this.ensureIndex(
          qr,
          'idx_nie_company_news_type_created',
          `CREATE INDEX idx_nie_company_news_type_created
             ON "news_interaction_event"("companyId","newsId","type","createdAt")`,
        );
      }

      if (hasCompanyId && hasType && hasCreatedAt) {
        await this.ensureIndex(
          qr,
          'idx_nie_company_type_created',
          `CREATE INDEX idx_nie_company_type_created
             ON "news_interaction_event"("companyId","type","createdAt")`,
        );
      }

      if (hasCompanyId && hasNewsId && hasCreatedAt) {
        await this.ensureIndex(
          qr,
          'idx_nie_company_news_created',
          `CREATE INDEX idx_nie_company_news_created
             ON "news_interaction_event"("companyId","newsId","createdAt")`,
        );
      }

      // parciais úteis (OPEN / ACK) — opcionais, mas baratas
      if (hasCompanyId && hasNewsId && hasCreatedAt && hasType) {
        await this.ensureIndex(
          qr,
          'idx_nie_company_news_open_created',
          `CREATE INDEX idx_nie_company_news_open_created
             ON "news_interaction_event"("companyId","newsId","createdAt")
           WHERE "type" = 'OPEN'`,
        );
        await this.ensureIndex(
          qr,
          'idx_nie_company_news_ack_created',
          `CREATE INDEX idx_nie_company_news_ack_created
             ON "news_interaction_event"("companyId","newsId","createdAt")
           WHERE "type" = 'ACK'`,
        );
      }
    }

    // -----------------------------
    // interaction_event (legado: pode ter objectType/objectId + type/event)
    // -----------------------------
    if (hasIE) {
      const hasObjectType = await this.col(qr, 'interaction_event', 'objectType');
      const hasObjectId   = await this.col(qr, 'interaction_event', 'objectId');
      const hasTypeCol    = await this.col(qr, 'interaction_event', 'type');
      const hasEventCol   = await this.col(qr, 'interaction_event', 'event');
      const hasCreatedAt  = await this.col(qr, 'interaction_event', 'createdAt');

      const typeExpr = hasTypeCol ? `"type"` : (hasEventCol ? `"event"` : null);

      if (hasObjectType && hasObjectId && typeExpr && hasCreatedAt) {
        await this.ensureIndex(
          qr,
          'idx_interact_company_object_type_created',
          `CREATE INDEX idx_interact_company_object_type_created
             ON "interaction_event"("companyId","objectType","objectId",${typeExpr},"createdAt")`,
        );
      } else if (typeExpr && hasCreatedAt) {
        await this.ensureIndex(
          qr,
          'idx_interact_company_type_created',
          `CREATE INDEX idx_interact_company_type_created
             ON "interaction_event"("companyId",${typeExpr},"createdAt")`,
        );
      }
    }
  }

  public async down(qr: QueryRunner): Promise<void> {
    const drop = async (name: string) => {
      const exists = await this.reg(qr, `public.${name}`);
      if (exists) await qr.query(`DROP INDEX "${name}"`);
    };

    await drop('idx_nie_company_news_user_type');
    await drop('idx_nie_company_news_type_created');
    await drop('idx_nie_company_type_created');
    await drop('idx_nie_company_news_created');
    await drop('idx_nie_company_news_open_created');
    await drop('idx_nie_company_news_ack_created');
    await drop('idx_interact_company_object_type_created');
    await drop('idx_interact_company_type_created');
  }
}