import { ForbiddenException, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { CommunicationsService } from 'src/notifications/communications.service'
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2'

type NewsRow = {
    id: string
    companyId: string
    title: string | null
    settings: any | null
    highlightImages: string[] | null
}

@Injectable()
export class NewsPushServiceV2 {
    constructor(
        private readonly ds: DataSource,
        private readonly comms: CommunicationsService,
        private readonly schema: SchemaIntrospectorV2,
    ) { }

    private webBase() {
        const origin = process.env.NEWS_WEB_BASE_URL || process.env.VITE_WEB_DEEPLINK_ORIGIN || 'http://localhost:5173'
        const path = process.env.NEWS_DEEPLINK_PATH || '/contents'
        return { origin, path }
    }

    private async loadNews(newsId: string): Promise<NewsRow> {
        // compat: news_entity ou news
        const sql = `
      WITH t AS (SELECT to_regclass('public.news_entity') ne, to_regclass('public.news') n)
      SELECT COALESCE(
        (SELECT jsonb_build_object(
           'id', e.id::text,
           'companyId', e."companyId"::text,
           'title', e.title,
           'settings', e.settings,
           'highlightImages', e."highlightImages"
         ) FROM news_entity e WHERE e.id=$1 LIMIT 1),
        (SELECT jsonb_build_object(
           'id', e.id::text,
           'companyId', e."companyId"::text,
           'title', e.title,
           'settings', e.settings,
           'highlightImages', e."highlightImages"
         ) FROM news e WHERE e.id=$1 LIMIT 1)
      ) obj
    `
        const r = await this.ds.query(sql, [newsId])
        const obj = r?.[0]?.obj
        if (!obj) throw new ForbiddenException('News not found')
        return obj
    }

    private async resolveAudience(companyId: string, newsId: string): Promise<string[]> {
        // Estratégia:
        // 1) se existir news_audience: usa
        // 2) senão, se existir relação por channel/space/grupos (não padronizado): tenta descobrir
        // 3) fallback: todos ativos da empresa
        const hasNewsAudience = await this.schema.hasTable('news_audience')
        if (hasNewsAudience) {
            const r = await this.ds.query(
                `SELECT array_agg(DISTINCT "userId"::text) AS uids
         FROM news_audience
         WHERE "companyId"=$1 AND "newsId"=$2`,
                [companyId, newsId],
            )
            const u: string[] = r?.[0]?.uids || []
            if (u.length) return u
        }

        // Fallback total
        const r2 = await this.ds.query(
            `SELECT array_agg(u.id::text) AS uids
       FROM users u
       WHERE u."companyId"=$1 AND COALESCE(u.active, true) = true`,
            [companyId],
        )
        return r2?.[0]?.uids || []
    }

    private async filterOnlyNotOpened(companyId: string, newsId: string, userIds: string[]) {
        const ev = await this.schema.detectEventMap()
        if (!ev) return userIds
        const r = await this.ds.query(
            `SELECT DISTINCT "userId"::text AS uid
         FROM ${ev.table}
        WHERE "companyId"=$1 AND "${ev.newsIdCol}"=$2 AND ${ev.typeCol} IN ('OPEN','open','ACK','ack')`,
            [companyId, newsId],
        )
        const opened = new Set<string>((r || []).map((x: any) => x.uid))
        return userIds.filter((id) => !opened.has(String(id)))
    }

    async send(companyId: string, newsId: string, opts: {
        onlyNotOpened?: boolean
        testUserId?: string
        overrideTitle?: string
        overrideBody?: string
    }) {
        const news = await this.loadNews(newsId)
        if (String(news.companyId) !== String(companyId)) {
            throw new ForbiddenException('News not accessible for this company')
        }

        const s = news.settings || {}
        const notify = s.pushNotification === true
        if (!notify && !opts.testUserId) {
            return { ok: true, accepted: 0, reason: 'pushNotification disabled in settings' }
        }

        let audience = opts.testUserId ? [String(opts.testUserId)] : await this.resolveAudience(companyId, newsId)
        if (!audience.length) return { ok: true, accepted: 0, reason: 'empty audience' }

        if (opts.onlyNotOpened) {
            audience = await this.filterOnlyNotOpened(companyId, newsId, audience)
            if (!audience.length) return { ok: true, accepted: 0, reason: 'no targets after OPEN/ACK filter' }
        }

        const title = opts.overrideTitle || s.pushTitle || news.title || 'Nova notícia'
        const body = opts.overrideBody || s.pushContent || 'Confira a publicação'
        const imageUrl = Array.isArray(news.highlightImages) && news.highlightImages.length ? String(news.highlightImages[0]) : null

        const { origin, path } = this.webBase()
        const deepLink = `${origin}${path}/${newsId}`

        const res = await this.comms.sendNewsPush({
            companyId,
            newsId,
            userIds: audience,
            title,
            body,
            imageUrl: imageUrl || undefined,
            deepLink,
        })

        // “Recebível” = audience length
        return { ok: true, requested: res.requested, success: res.success, failure: res.failure, receivable: audience.length, deeplink: deepLink }
    }
}