import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommunicationsService } from 'src/notifications/communications.service';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

type NewsRow = {
  id: string;
  companyId: string;
  title: string | null;
  settings: any | null;
  highlightImages: string[] | null;
};

@Injectable()
export class NewsPushServiceV2 {
  private readonly logger = new Logger('NewsPushServiceV2');

  constructor(
    private readonly ds: DataSource,
    private readonly comms: CommunicationsService,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private webBase() {
    const origin =
      process.env.NEWS_WEB_BASE_URL ||
      process.env.VITE_WEB_DEEPLINK_ORIGIN ||
      'http://localhost:5173';
    const path = '/contents';
    return { origin, path };
  }

  private mobileDeeplink(newsId: string) {
    const schema = (process.env.NEWS_DEEPLINK_SCHEMA || 'iuppydev').replace(
      '://',
      '',
    );
    const path = (process.env.NEWS_DEEPLINK_PATH || '/news/article').replace(
      /^\/+/,
      '',
    );
    return `${schema}://${path}/${newsId}`;
  }

  private async loadNews(newsId: string): Promise<{
    id: string;
    companyId: string;
    title: string;
    settings: any;
    highlightImages: string[] | null;
  }> {
    const row1 = await this.ds.query(
      `
      SELECT jsonb_build_object(
        'id', e.id::text,
        'companyId', e."companyId"::text,
        'title', e.title,
        'settings', e.settings,
        'highlightImages', e."highlightImages"
      ) AS obj
      FROM news_entity e
      WHERE e.id = $1
      LIMIT 1
      `,
      [newsId],
    );
    if (row1?.[0]?.obj) return row1[0].obj;

    const reg = await this.ds.query(`SELECT to_regclass('public.news') AS reg`);
    const hasLegacy = !!reg?.[0]?.reg;

    if (hasLegacy) {
      const row2 = await this.ds.query(
        `
        SELECT jsonb_build_object(
          'id', e.id::text,
          'companyId', e."companyId"::text,
          'title', e.title,
          'settings', e.settings,
          'highlightImages', e."highlightImages"
        ) AS obj
        FROM news e
        WHERE e.id = $1
        LIMIT 1
        `,
        [newsId],
      );
      if (row2?.[0]?.obj) return row2[0].obj;
    }

    throw new Error(`News not found for id=${newsId}`);
  }

  private async selectAllCompanyUsers(companyId: string): Promise<string[]> {
    const hasUserEntity = await this.schema.hasTable('user_entity');
    if (hasUserEntity) {
      const r = await this.ds.query(
        `SELECT array_agg(u.id::text) AS uids FROM user_entity u WHERE u."companyId" = $1`,
        [companyId],
      );
      return (r?.[0]?.uids ?? []) as string[];
    }

    const hasUsers = await this.schema.hasTable('users');
    if (hasUsers) {
      const r = await this.ds.query(
        `SELECT array_agg(u.id::text) AS uids FROM users u WHERE u."companyId" = $1`,
        [companyId],
      );
      return (r?.[0]?.uids ?? []) as string[];
    }

    return [];
  }

  private async selectAudienceFromNewsAudience(
    companyId: string,
    newsId: string,
  ): Promise<string[] | null> {
    const hasNewsAudience = await this.schema.hasTable('news_audience');
    if (!hasNewsAudience) return null;

    const r = await this.ds.query(
      `
      SELECT array_agg(DISTINCT "userId"::text) AS uids
      FROM news_audience
      WHERE "companyId" = $1 AND "newsId" = $2
      `,
      [companyId, newsId],
    );

    return (r?.[0]?.uids ?? []) as string[];
  }

  private async resolveAudience(
    companyId: string,
    newsId: string,
    settings: any,
  ): Promise<string[]> {
    const visibility = (settings?.visibility ?? 'public') as string;

    const fromNA = await this.selectAudienceFromNewsAudience(companyId, newsId);
    if (fromNA !== null) {
      if (fromNA.length > 0) {
        this.logger.log(
          `[audience] news_audience (explicit) → ${fromNA.length} users`,
        );
        return fromNA;
      }
      if (visibility === 'public' || visibility === 'all_users') {
        const all = await this.selectAllCompanyUsers(companyId);
        this.logger.log(
          `[audience] news_audience vazio + visibility=${visibility} → all users: ${all.length}`,
        );
        return all;
      }
      this.logger.warn(
        `[audience] news_audience vazio + visibility=${visibility} (segmentado) → audiência vazia`,
      );
      return [];
    }

    if (visibility === 'public' || visibility === 'all_users') {
      const all = await this.selectAllCompanyUsers(companyId);
      this.logger.log(
        `[audience] sem news_audience + visibility=${visibility} → all users: ${all.length}`,
      );
      return all;
    }

    this.logger.warn(
      `[audience] sem news_audience + visibility=${visibility} (segmentado) → audiência vazia`,
    );
    return [];
  }

  /**
   * Filtra audiência removendo quem já abriu/ack — e opcionalmente
   * quem não abriu em X horas após 'deliveredAt'.
   */
  private async filterOnlyNotOpened(
    companyId: string,
    newsId: string,
    userIds: string[],
    minHoursSinceDelivery?: number,
  ) {
    const ev = await this.schema.detectEventMap();
    if (!ev) {
      this.logger.warn(
        '[filter] v2 events map não encontrado — sem filtro OPEN/ACK',
      );
      return userIds;
    }

    // Base: remove quem já tem OPEN/ACK em qualquer tempo
    const r = await this.ds.query(
      `
      SELECT DISTINCT "userId"::text AS uid
      FROM ${ev.table}
      WHERE "companyId" = $1
        AND "${ev.newsIdCol}" = $2
        AND ${ev.typeCol} IN ('OPEN','open','ACK','ack')`,
      [companyId, newsId],
    );
    const opened = new Set<string>((r || []).map((x: any) => x.uid));
    let filtered = userIds.filter((id) => !opened.has(String(id)));

    // Se pediram janela: manter apenas quem NÃO abriu dentro da janela após entrega
    if (minHoursSinceDelivery && minHoursSinceDelivery > 0) {
      const hrs = Math.max(1, Math.floor(minHoursSinceDelivery));
      const cand = await this.ds.query(
        `
        WITH d AS (
          SELECT DISTINCT ON (pd."userId")
                 pd."userId"::text AS uid, pd."deliveredAt"
            FROM push_delivery pd
           WHERE pd."companyId"=$1 AND pd."newsId"=$2 AND pd."deliveredAt" IS NOT NULL
           ORDER BY pd."userId", pd."deliveredAt" DESC
        ),
        o AS (
          SELECT e."userId"::text AS uid, MIN(e."createdAt") AS first_open
            FROM ${ev.table} e
           WHERE e."companyId"=$1 AND e."${ev.newsIdCol}"=$2 AND UPPER(e.${ev.typeCol}::text)='OPEN'
           GROUP BY e."userId"
        )
        SELECT d.uid
          FROM d
     LEFT JOIN o ON o.uid = d.uid
         WHERE
               -- nunca abriu após receber
               (o.first_open IS NULL)
            OR -- abriu, mas depois da janela pedida
               (o.first_open >= d."deliveredAt" + INTERVAL '${hrs} hours')
            OR -- entregou, já passaram hrs e não houve open
               (now() >= d."deliveredAt" + INTERVAL '${hrs} hours' AND (o.first_open IS NULL OR o.first_open < d."deliveredAt"))
        `,
        [companyId, newsId],
      );
      const keep = new Set<string>((cand || []).map((x: any) => x.uid));
      filtered = filtered.filter((u) => keep.has(u));
      this.logger.log(
        `[filter] janela ${hrs}h após entrega → candidatos=${cand?.length || 0}, restantes=${filtered.length}`,
      );
    }

    this.logger.log(
      `[filter] OPEN/ACK: total=${userIds.length} opened=${opened.size} remaining=${filtered.length}`,
    );
    return filtered;
  }

  async send(
    companyId: string,
    newsId: string,
    opts: {
      onlyNotOpened?: boolean;
      minHoursSinceDelivery?: number;
      testUserId?: string;
      overrideTitle?: string;
      overrideBody?: string;
      testToken?: string;
      testTokens?: string[];
    },
  ) {
    const reqId = Math.random().toString(36).slice(2, 10);
    const news = await this.loadNews(newsId);
    if (String(news.companyId) !== String(companyId)) {
      throw new ForbiddenException('News not accessible for this company');
    }

    const s = (news.settings || {}) as any;
    const notify = s.pushNotification === true;

    const title =
      opts.overrideTitle || s.pushTitle || news.title || 'Nova notícia';
    const body = opts.overrideBody || s.pushContent || 'Confira a publicação';
    const imageUrl =
      Array.isArray(news.highlightImages) && news.highlightImages.length
        ? String(news.highlightImages[0])
        : null;

    const { origin, path } = this.webBase();
    const webLink = `${origin}${path}/${newsId}`;
    const deepLinkMobile = this.mobileDeeplink(newsId);

    // ——— TESTE POR TOKENS DIRETOS ———
    const directTokens: string[] = [];
    if (opts.testToken && typeof opts.testToken === 'string')
      directTokens.push(opts.testToken);
    if (Array.isArray(opts.testTokens) && opts.testTokens.length)
      directTokens.push(...opts.testTokens.filter(Boolean));

    if (directTokens.length > 0) {
      this.logger.warn(
        `[${reqId}] [send][TEST] tokens=${directTokens.length} — ignorando audiência`,
      );
      const res = await this.comms.sendDirectTokens({
        companyId,
        tokens: Array.from(new Set(directTokens)),
        title,
        body,
        imageUrl: imageUrl || undefined,
        deepLinkMobile,
        webLink,
        kind: 'NEWS',
        entityId: newsId,
      });
      return {
        ok: true,
        mode: 'testTokens',
        requested: res.requested,
        success: res.success,
        failure: res.failure,
        receivable: directTokens.length,
        deeplinkMobile: deepLinkMobile,
        webLink,
      };
    }

    // ——— MODO NORMAL ———
    if (!notify && !opts.testUserId) {
      this.logger.warn(
        `[${reqId}] send: pushNotification OFF → skip (newsId=${newsId})`,
      );
      return {
        ok: true,
        accepted: 0,
        reason: 'pushNotification disabled in settings',
      };
    }

    let audience = opts.testUserId
      ? [String(opts.testUserId)]
      : await this.resolveAudience(companyId, newsId, s);

    if (!audience.length) {
      this.logger.warn(`[${reqId}] audiência vazia (newsId=${newsId})`);
      return { ok: true, accepted: 0, reason: 'empty audience' };
    }

    if (opts.onlyNotOpened) {
      audience = await this.filterOnlyNotOpened(
        companyId,
        newsId,
        audience,
        opts.minHoursSinceDelivery,
      );
      if (!audience.length) {
        this.logger.warn(`[${reqId}] após filtro OPEN/ACK → audiência vazia`);
        return {
          ok: true,
          accepted: 0,
          reason: 'no targets after OPEN/ACK filter',
        };
      }
    }

    this.logger.log(
      `[${reqId}] payload title="${title}" image=${!!imageUrl} deepLinkMobile=${deepLinkMobile} webLink=${webLink} audience=${audience.length}`,
    );

    const res = await this.comms.sendNewsPush({
      companyId,
      newsId,
      userIds: audience,
      title,
      body,
      imageUrl: imageUrl || undefined,
      deepLinkMobile,
      webLink,
    });

    this.logger.log(
      `[${reqId}] result receivable=${audience.length} requested=${res.requested} success=${res.success} failure=${res.failure}`,
    );

    return {
      ok: true,
      requested: res.requested,
      success: res.success,
      failure: res.failure,
      receivable: audience.length,
      deeplinkMobile: deepLinkMobile,
      webLink,
    };
  }
}
