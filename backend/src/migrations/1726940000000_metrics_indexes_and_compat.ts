import { MigrationInterface, QueryRunner } from 'typeorm'

export class MetricsIndexesAndCompat1726940000000 implements MigrationInterface {
  name = 'MetricsIndexesAndCompat1726940000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // news_comment: índice depende se a tabela usa approved:boolean ou status:text
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_comment') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='news_comment' AND column_name='approved'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_comment_approved') THEN
        EXECUTE 'CREATE INDEX idx_news_comment_approved ON news_comment ("companyId","newsId","approved","createdAt")';
      END IF;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='news_comment' AND column_name='status'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_comment_status') THEN
        EXECUTE 'CREATE INDEX idx_news_comment_status ON news_comment ("companyId","newsId","status","createdAt")';
      END IF;
    END IF;
  END IF;
END$$;
    `)

    // eventos: news_interaction_event OU interaction_event
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_interaction_event') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_nie_metrics') THEN
      EXECUTE 'CREATE INDEX idx_nie_metrics ON news_interaction_event ("companyId","newsId","userId","type","createdAt")';
    END IF;
  ELSIF to_regclass('public.interaction_event') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_ie_metrics') THEN
      EXECUTE 'CREATE INDEX idx_ie_metrics ON interaction_event ("companyId","objectId","userId","event","createdAt")';
    END IF;
  END IF;
END$$;
    `)

    // reactions
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_reaction') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_reaction_metrics') THEN
      EXECUTE 'CREATE INDEX idx_news_reaction_metrics ON news_reaction ("companyId","newsId","userId","createdAt")';
    END IF;
  END IF;
END$$;
    `)

    // shares
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_share') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_share_metrics') THEN
      EXECUTE 'CREATE INDEX idx_news_share_metrics ON news_share ("companyId","newsId","userId","createdAt")';
    END IF;
  END IF;
END$$;
    `)

    // audience snapshot
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_audience') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_audience') THEN
      EXECUTE 'CREATE INDEX idx_news_audience ON news_audience ("companyId","newsId")';
    END IF;
  END IF;
END$$;
    `)

    // diários (news / user)
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.news_metrics_daily') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_news_metrics_daily') THEN
      EXECUTE 'CREATE INDEX idx_news_metrics_daily ON news_metrics_daily ("newsId","date")';
    END IF;
  END IF;

  IF to_regclass('public.user_metrics_daily') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_user_metrics_daily') THEN
      EXECUTE 'CREATE INDEX idx_user_metrics_daily ON user_metrics_daily ("userId","date")';
    END IF;
  END IF;
END$$;
    `)

    // push_delivery (CTR de push)
    await queryRunner.query(`
DO $$
BEGIN
  IF to_regclass('public.push_delivery') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_push_delivery_metrics') THEN
      EXECUTE 'CREATE INDEX idx_push_delivery_metrics ON push_delivery ("companyId","newsId","deliveredAt")';
    END IF;
  END IF;
END$$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop somente se existir (seguro p/ rollback)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_comment_approved') IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_comment_approved'; END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_comment_status')   IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_comment_status';   END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_nie_metrics')          IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_nie_metrics';          END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_ie_metrics')           IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_ie_metrics';           END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_reaction_metrics')IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_reaction_metrics';END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_share_metrics')   IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_share_metrics';   END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_audience')        IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_audience';        END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_news_metrics_daily')   IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_news_metrics_daily';   END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_user_metrics_daily')   IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_user_metrics_daily';   END IF; END$$;`)
    await queryRunner.query(`DO $$ BEGIN IF to_regclass('public.idx_push_delivery_metrics')IS NOT NULL THEN EXECUTE 'DROP INDEX public.idx_push_delivery_metrics';END IF; END$$;`)
  }
}
