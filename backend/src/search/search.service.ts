import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { NewsEntity } from '../news/news.entity';

export interface SearchResult {
    id: string;
    type: 'news' | 'form' | 'survey' | 'journey';
    title: string;
    subtitle?: string;
    imageUrl?: string;
    createdAt: Date;
    metadata?: any;
}

import { AudienceMode } from '@shared/types/NewsSettings';
import { InteractionEventEntity } from '../v2/interactions/entities/interaction-event.entity';
import { CommunicationsService } from 'src/notifications/communications.service';
import { SearchLogEntity } from './search-log.entity';

import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { SurveyEntity } from '../modules/surveys/entities/survey.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(NewsEntity)
        private readonly newsRepo: Repository<NewsEntity>,
        @InjectRepository(SearchLogEntity)
        private readonly searchLogRepo: Repository<SearchLogEntity>,
        @InjectRepository(JourneyEntity)
        private readonly journeyRepo: Repository<JourneyEntity>,
        @InjectRepository(FormEntity)
        private readonly formRepo: Repository<FormEntity>,
        @InjectRepository(SurveyEntity)
        private readonly surveyRepo: Repository<SurveyEntity>,
        private readonly comm: CommunicationsService, // Added CommunicationsService
    ) { }

    async onModuleInit() {
        // Self-healing: Ensure search_log table exists
        const exists = await this.tableExists('search_log');
        if (!exists) {
            console.log('Creating search_log table...');
            await this.newsRepo.query(`
                CREATE TABLE IF NOT EXISTS "search_log" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "companyId" character varying NOT NULL,
                    "userId" character varying NOT NULL,
                    "query" character varying NOT NULL,
                    "resultCount" integer NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_search_log" PRIMARY KEY ("id")
                )
            `);
        }

        try {
            await this.newsRepo.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
            await this.newsRepo.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
        } catch (e) {
            console.warn('Failed to enable extensions (pg_trgm/unaccent). Ensure DB user has permissions.', e);
        }
    }

    private async tableExists(tableName: string): Promise<boolean> {
        const result = await this.newsRepo.query(
            `SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                AND table_name = $1
            );`,
            [tableName]
        );
        return result[0].exists;
    }

    async search(companyId: string, query: string, limit: number = 20, userId?: string): Promise<SearchResult[]> {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const term = query.trim();
        const likeTerm = `%${term}%`;
        const results: SearchResult[] = [];

        // Helper for fuzzy search condition
        // We use ILIKE for substring match (fast, simple) OR similarity for typos (slower but powerful)
        // similarity() requires pg_trgm. threshold is usually 0.3
        const fuzzy = (col: string, param: string) =>
            `(${col} ILIKE :${param}Like OR similarity(${col}, :${param}) > 0.1)`;

        // 1. Search News
        const newsItems = await this.newsRepo.createQueryBuilder('news')
            .where('news.companyId = :companyId', { companyId })
            .andWhere('news.isPublished = true')
            .andWhere(new Brackets(qb => {
                qb.where(`news.title ILIKE :termLike OR similarity(news.title, :term) > 0.1`, { term, termLike: likeTerm })
                    .orWhere(`news.subtitle ILIKE :termLike OR similarity(news.subtitle, :term) > 0.1`, { term, termLike: likeTerm })
                    .orWhere(`news.content ILIKE :termLike`, { termLike: likeTerm })
                    // Fuzzy search for hashtags: UNNEST, then check for basic match (ILIKE) or similarity
                    .orWhere(`EXISTS (
                        SELECT 1 FROM UNNEST(news.hashtags) AS tag 
                        WHERE tag ILIKE :termLike OR similarity(tag, :term) > 0.3
                    )`, { term, termLike: likeTerm });
            }))
            .orderBy('news.createdAt', 'DESC')
            .take(limit)
            .getMany();

        results.push(...newsItems.map(n => ({
            id: n.id,
            type: 'news' as const,
            title: n.title,
            subtitle: n.subtitle,
            imageUrl: n.highlightImages?.[0],
            createdAt: n.createdAt,
            metadata: {
                channelId: n.channelId,
                hashtags: n.hashtags
            }
        })));

        // 2. Search Journeys
        const journeyItems = await this.journeyRepo.createQueryBuilder('j')
            .where('j.companyId = :companyId', { companyId })
            .andWhere('j.active = true')
            .andWhere(new Brackets(qb => {
                qb.where(`j.title ILIKE :termLike OR similarity(j.title, :term) > 0.1`, { term, termLike: likeTerm })
                    .orWhere(`j.description ILIKE :termLike OR similarity(j.description, :term) > 0.1`, { term, termLike: likeTerm });
            }))
            .orderBy('j.createdAt', 'DESC')
            .take(limit)
            .getMany();

        results.push(...journeyItems.map(j => ({
            id: j.id,
            type: 'journey' as const,
            title: j.title,
            subtitle: j.description,
            createdAt: j.createdAt,
        })));

        // 3. Search Forms
        const formItems = await this.formRepo.createQueryBuilder('f')
            .where('f.companyId = :companyId', { companyId })
            .andWhere("f.status = 'published'")
            .andWhere(new Brackets(qb => {
                // JSONB search is tricky with similarity. We cast to text.
                qb.where(`f.title::text ILIKE :termLike`, { termLike: likeTerm })
                    .orWhere(`f.description::text ILIKE :termLike`, { termLike: likeTerm });
            }))
            .orderBy('f.createdAt', 'DESC')
            .take(limit)
            .getMany();

        results.push(...formItems.map(f => {
            const getStr = (v: any) => {
                if (!v) return '';
                if (typeof v === 'string') return v;
                return v['pt-BR'] || v['en'] || Object.values(v)[0] || '';
            };
            return {
                id: f.id,
                type: 'form' as const,
                title: getStr(f.title),
                subtitle: getStr(f.description),
                createdAt: f.createdAt,
            };
        }));

        // 4. Search Surveys
        const surveyItems = await this.surveyRepo.createQueryBuilder('s')
            .where('s.companyId = :companyId', { companyId })
            .andWhere("s.status = 'published'")
            .andWhere(new Brackets(qb => {
                qb.where(`s.title ILIKE :termLike OR similarity(s.title, :term) > 0.1`, { term, termLike: likeTerm })
                    .orWhere(`s.description ILIKE :termLike OR similarity(s.description, :term) > 0.1`, { term, termLike: likeTerm });
            }))
            .orderBy('s.createdAt', 'DESC')
            .take(limit)
            .getMany();

        results.push(...surveyItems.map(s => ({
            id: s.id,
            type: 'survey' as const,
            title: s.title,
            subtitle: s.description,
            createdAt: s.createdAt,
        })));

        const finalResults = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

        // Log search asynchronously
        if (userId) {
            this.searchLogRepo.save({
                companyId,
                userId,
                query: term,
                resultCount: finalResults.length,
            }).catch(err => console.error('Error logging search:', err));
        }

        return finalResults;
    }

    async getTopTerms(companyId: string, days: number = 30, limit: number = 10): Promise<{ term: string; count: number; users: number; trend: number }[]> {
        const now = new Date();
        const currentStart = new Date();
        currentStart.setDate(now.getDate() - days);

        const previousStart = new Date();
        previousStart.setDate(currentStart.getDate() - days);

        // 1. Get current period stats (Count & Unique Users)
        const currentStats = await this.searchLogRepo
            .createQueryBuilder('log')
            .select('log.query', 'term')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COUNT(DISTINCT log.userId)', 'users')
            .where('log.companyId = :companyId', { companyId })
            .andWhere('log.createdAt >= :currentStart', { currentStart })
            .groupBy('log.query')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        // 2. Get previous period stats for trend calculation
        const terms = currentStats.map(s => s.term);
        let previousStats: any[] = [];

        if (terms.length > 0) {
            previousStats = await this.searchLogRepo
                .createQueryBuilder('log')
                .select('log.query', 'term')
                .addSelect('COUNT(*)', 'count')
                .where('log.companyId = :companyId', { companyId })
                .andWhere('log.createdAt >= :previousStart', { previousStart })
                .andWhere('log.createdAt < :currentStart', { currentStart })
                .andWhere('log.query IN (:...terms)', { terms })
                .groupBy('log.query')
                .getRawMany();
        }

        const prevMap = new Map(previousStats.map(s => [s.term, Number(s.count)]));

        return currentStats.map(r => {
            const currentCount = Number(r.count);
            const prevCount = prevMap.get(r.term) || 0;

            let trend = 0;
            if (prevCount === 0) {
                trend = currentCount > 0 ? 100 : 0; // New term = 100% growth
            } else {
                trend = Math.round(((currentCount - prevCount) / prevCount) * 100);
            }

            return {
                term: r.term,
                count: currentCount,
                users: Number(r.users),
                trend
            };
        });
    }

    async getNoResultsTerms(companyId: string, days: number = 30, limit: number = 10): Promise<{ term: string; count: number }[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const result = await this.searchLogRepo
            .createQueryBuilder('log')
            .select('log.query', 'term')
            .addSelect('COUNT(*)', 'count')
            .where('log.companyId = :companyId', { companyId })
            .andWhere('log.createdAt >= :since', { since })
            .andWhere('log.resultCount = 0')
            .groupBy('log.query')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map(r => ({ term: r.term, count: Number(r.count) }));
    }
}
