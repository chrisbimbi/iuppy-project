import { MigrationInterface, QueryRunner } from 'typeorm'

export class PushAnalyticsAlignment1729150000000 implements MigrationInterface {
  name = 'PushAnalyticsAlignment1729150000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ——— news_interaction_event: meta + soltar unique antigo ———
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.news_interaction_event
         ADD COLUMN IF NOT EXISTS meta jsonb NULL`,
    )

    // remover UNIQUE antigo (se existir)
    await queryRunner.query(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM pg_constraint
            WHERE conname = 'uq_news_interaction_event_company_news_user_type'
         ) THEN
           ALTER TABLE public.news_interaction_event
             DROP CONSTRAINT uq_news_interaction_event_company_news_user_type;
         END IF;
       END$$;`,
    )

    // índice único PARCIAL apenas para ACK — sem funções (evita erro de imutabilidade)
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_ack_partial
         ON public.news_interaction_event ("companyId","newsId","userId")
         WHERE "type" = 'ACK';`,
    )

    // ——— push_delivery: garantir colunas do funil ———
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.push_delivery
         ADD COLUMN IF NOT EXISTS channel text DEFAULT 'remind',
         ADD COLUMN IF NOT EXISTS provider text NULL,
         ADD COLUMN IF NOT EXISTS "messageId" text NULL,
         ADD COLUMN IF NOT EXISTS token text NULL,
         ADD COLUMN IF NOT EXISTS status text DEFAULT 'queued',
         ADD COLUMN IF NOT EXISTS "sentAt" timestamptz NULL,
         ADD COLUMN IF NOT EXISTS "deliveredAt" timestamptz NULL,
         ADD COLUMN IF NOT EXISTS "openedAt" timestamptz NULL,
         ADD COLUMN IF NOT EXISTS meta jsonb NULL,
         ADD COLUMN IF NOT EXISTS error text NULL`,
    )

    // createdAt/updatedAt (se faltarem)
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.push_delivery
         ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
         ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now()`,
    )

    // índices úteis
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_push_delivery_company_news ON public.push_delivery ("companyId","newsId")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_push_delivery_company_status ON public.push_delivery ("companyId","status")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_push_delivery_company_created ON public.push_delivery ("companyId","createdAt")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversão mínima e segura
    await queryRunner.query(`DROP INDEX IF EXISTS uq_ack_partial`)
    // (não removemos colunas para não perder dados)
  }
}
