// backend/src/modules/forms/analytics/forms-analytics.cron.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { FormsAnalyticsService } from './forms-analytics.service';

@Injectable()
export class FormsAnalyticsCron {
    private readonly logger = new Logger(FormsAnalyticsCron.name);
    private isRunning = false;

    constructor(
        private readonly ds: DataSource,
        private readonly analyticsService: FormsAnalyticsService,
    ) { }

    // Executa todo dia às 2:00 da manhã
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleDailyAggregation() {
        if (this.isRunning) {
            this.logger.warn('Job de agregação diária já está em execução. Pulando.');
            return;
        }

        this.logger.log('Iniciando job de agregação diária de métricas...');
        this.isRunning = true;

        try {
            const companies = await this.ds.query(
                `SELECT "id" FROM "company" WHERE "status" = 'active'`,
            );
            if (!companies || companies.length === 0) {
                this.logger.log('Nenhuma companhia ativa encontrada.');
                return;
            }

            // Define o período como "ontem"
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

            for (const company of companies) {
                const companyId = company.id;
                try {
                    this.logger.log(`Agregando dados para a companhia: ${companyId}`);
                    await this.analyticsService.runDailyAggregation(companyId, dateStr);
                } catch (e: any) {
                    this.logger.error(
                        `Falha ao agregar dados para a companhia ${companyId}: ${e.message}`,
                        e.stack,
                    );
                }
            }
        } catch (e: any) {
            this.logger.error(
                `Falha crítica no job de agregação diária: ${e.message}`,
                e.stack,
            );
        } finally {
            this.isRunning = false;
            this.logger.log('Job de agregação diária finalizado.');
        }
    }
}