import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddMissingColumns1700940000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Ação 1.A: Adicionar coluna 'meta' em news_interaction_event (Resolve Falha de Open/Ack)
    // Isso resolve o erro: column "meta" of relation "news_interaction_event" does not exist
    if (!(await queryRunner.hasColumn('news_interaction_event', 'meta'))) {
      await queryRunner.query(
        `ALTER TABLE "news_interaction_event" ADD COLUMN meta jsonb`,
      );
    }

    // --- Ação 1.B: Adicionar coluna 'companyId' em news_metrics_daily (Resolve Falha de Métricas Diárias)
    // Isso é crucial, pois o serviço tenta inserir 'companyId' no MetricsDailyServiceV2.onEvent
    if (!(await queryRunner.hasColumn('news_metrics_daily', 'companyId'))) {
      await queryRunner.query(
        `ALTER TABLE "news_metrics_daily" ADD COLUMN "companyId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'`,
      );
    }

    // Se a coluna companyId foi adicionada, precisamos recriar o índice ON CONFLICT
    if (await queryRunner.hasColumn('news_metrics_daily', 'companyId')) {
      try {
        // Criar índice composto com companyId, newsId e date
        await queryRunner.createIndex(
          'news_metrics_daily',
          new TableIndex({
            columnNames: ['companyId', 'newsId', 'date'],
            isUnique: true,
            name: 'news_metrics_daily_companyId_newsId_date_unique',
          }),
        );
      } catch (error) {
        // Index already exists, continue
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rotina de rollback (opcional, mas boa prática)
    await queryRunner.dropColumn('news_interaction_event', 'meta');
    await queryRunner.dropIndex(
      'news_metrics_daily',
      'news_metrics_daily_companyId_newsId_date_unique',
    );
    await queryRunner.dropColumn('news_metrics_daily', 'companyId');
  }
}
