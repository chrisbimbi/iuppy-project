import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as admin from 'firebase-admin';

type Platform = 'web' | 'android' | 'ios';

type SendPushInput = {
  companyId: string;
  userIds: string[];
  title: string;
  body: string;
  imageUrl?: string;
  deepLinkMobile?: string; // DATA→ deepLink (app)
  webLink?: string;        // webpush.fcmOptions.link (web)
  data?: Record<string, string | number | boolean | null | undefined>;
  kind: 'NEWS' | string;
  entityId?: string;       // <- para NEWS, é o newsId
};

type TokenRow = { userId: string; platform: Platform; token: string; id: string };

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger('CommunicationsService');

  private readonly CHUNK = 500;
  private readonly DEBUG_PAYLOAD = process.env.PUSH_LOG_PAYLOAD === '1';
  private readonly DEBUG_TOKENS = process.env.PUSH_LOG_TOKENS === '1';

  constructor(private readonly ds: DataSource) {}

  private maskToken(t: string) {
    if (!t) return '';
    if (this.DEBUG_TOKENS) return t;
    if (t.length <= 12) return `${t.slice(0, 2)}***${t.slice(-2)}`;
    return `${t.slice(0, 6)}***${t.slice(-6)}`;
  }

  private async tableExists(name: string): Promise<boolean> {
    const r = await this.ds.query(`SELECT to_regclass($1) IS NOT NULL AS x`, [`public.${name}`]);
    return !!r?.[0]?.x;
  }

  private split<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  // shape dinâmico de push_delivery
  private async getPushDeliveryColumns(): Promise<Set<string> | null> {
    const exists = await this.tableExists('push_delivery');
    if (!exists) return null;
    const rows = await this.ds.query(
      `SELECT a.attname AS col
         FROM pg_attribute a
         JOIN pg_class c ON a.attrelid=c.oid
         JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname='push_delivery' AND a.attnum>0`,
    );
    return new Set<string>((rows || []).map((r: any) => r.col));
  }

  private async insertPushDeliveryDynamic(cols: Set<string>, row: {
    companyId?: string; userId?: string | null; platform?: Platform;
    token?: string; provider?: string; channel?: string;
    status?: 'queued' | 'delivered' | 'failed';
    sentAt?: Date | null; deliveredAt?: Date | null; openedAt?: Date | null;
    meta?: any; error?: string | null; kind?: string | null; entityId?: string | null;
    newsId?: string | null; // <- novo
  }) {
    const fields: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    const put = (name: string, value: any) => {
      if (!cols.has(name)) return;
      fields.push(`"${name}"`);
      values.push(value);
      placeholders.push(`$${values.length}`);
    };

    // mapeia NEWS → newsId quando a coluna existir
    const finalNewsId =
      row.newsId ?? (row.kind === 'NEWS' ? (row.entityId ?? null) : null);

    put('companyId', row.companyId ?? null);
    put('userId', row.userId ?? null);
    put('platform', row.platform ?? null);
    put('token', row.token ?? null);
    put('provider', row.provider ?? 'fcm');
    put('channel', row.channel ?? 'notify');
    put('status', row.status ?? 'delivered');
    put('sentAt', row.sentAt ?? new Date());
    put('deliveredAt', row.deliveredAt ?? new Date());
    put('openedAt', row.openedAt ?? null);
    put('meta', row.meta ? JSON.stringify(row.meta) : JSON.stringify({}));
    put('error', row.error ?? null);
    put('kind', row.kind ?? null);
    put('entityId', row.entityId ?? null);
    put('newsId', finalNewsId); // <- essencial p/ NOT NULL

    if (!fields.length) return;
    const sql = `INSERT INTO push_delivery (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    await this.ds.query(sql, values);
  }

  private renderTemplate(tpl?: string, params: Record<string, string> = {}): string | undefined {
    if (!tpl) return undefined;
    return tpl.replace(/:([a-zA-Z0-9_]+)/g, (_m, k) => params[k] ?? '');
  }

  private buildNewsLinks(newsId: string) {
    const dlTpl = process.env.APP_NEWS_DEEPLINK_TEMPLATE || '';
    const wlTpl = process.env.APP_NEWS_WEBLINK_TEMPLATE || '';
    const deepLinkMobile = this.renderTemplate(dlTpl, { id: newsId });
    const webLink = this.renderTemplate(wlTpl, { id: newsId });
    return { deepLinkMobile, webLink };
  }

  private buildCrossPlatformMessage(
    title: string,
    body: string,
    imageUrl?: string,
    deepLinkMobile?: string,
    webLink?: string,
    dataBase?: Record<string, any>,
  ): Omit<admin.messaging.MulticastMessage, 'tokens'> {
    const data: Record<string, string> = {};
    if (dataBase) {
      for (const [k, v] of Object.entries(dataBase)) {
        if (v === undefined || v === null) continue;
        data[k] = String(v);
      }
    }
    if (deepLinkMobile) data['deepLink'] = deepLinkMobile;

    return {
      notification: { title, body, ...(imageUrl ? { image: imageUrl } : {}) },
      data,
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: process.env.FCM_ANDROID_CHANNEL_ID || 'news_channel',
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcmOptions: { analyticsLabel: 'news_android' },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { alert: { title, body }, sound: 'default', 'mutable-content': 1 } },
        fcmOptions: { analyticsLabel: 'news_ios' },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: { icon: process.env.FCM_WEB_ICON || undefined, ...(imageUrl ? { image: imageUrl } : {}) },
        fcmOptions: { link: webLink },
      },
    };
  }

  private async fetchTokens(companyId: string, userIds: string[]): Promise<TokenRow[]> {
    // aceita devices com companyId=null (multi-tenant permissivo)
    return this.ds.query(
      `SELECT "userId","platform","token","id"
         FROM user_device
        WHERE "enabled"=true
          AND "userId"=ANY($2::uuid[])
          AND ("companyId"=$1 OR "companyId" IS NULL)`,
      [companyId, userIds],
    );
  }

  private groupByPlatform(tokens: TokenRow[]) {
    const by: Record<Platform, TokenRow[]> = { web: [], android: [], ios: [] };
    for (const t of tokens) {
      if (t.platform === 'web' || t.platform === 'android' || t.platform === 'ios') by[t.platform].push(t);
    }
    return by;
  }

  async sendPush(input: SendPushInput) {
    // garante deepLink/webLink mesmo se não vierem preenchidos
    const newsIdForLink = input.kind === 'NEWS' ? (input.entityId || '') : '';
    const autoLinks = newsIdForLink ? this.buildNewsLinks(newsIdForLink) : { deepLinkMobile: undefined, webLink: undefined };
    const deepLinkMobile = input.deepLinkMobile ?? autoLinks.deepLinkMobile;
    const webLink = input.webLink ?? autoLinks.webLink;

    const reqId = Math.random().toString(36).slice(2, 10);
    this.logger.log(
      `[${reqId}] sendPush start kind=${input.kind} entityId=${input.entityId} users=${input.userIds.length} deepLinkMobile=${deepLinkMobile} webLink=${webLink}`,
    );

    const tokens = await this.fetchTokens(input.companyId, input.userIds);
    this.logger.log(`[${reqId}] tokens total=${tokens.length} (users distinct=${new Set(tokens.map(t => t.userId)).size})`);

    const by = this.groupByPlatform(tokens);
    const cols = await this.getPushDeliveryColumns();
    const results = { requested: 0, success: 0, failure: 0 };

    const baseData = {
      companyId: input.companyId,
      kind: input.kind,
      entityId: input.entityId || '',
    };

    for (const platform of ['android', 'ios', 'web'] as Platform[]) {
      const rows = by[platform];
      if (!rows.length) continue;

      const chunks = this.split(rows, this.CHUNK);
      this.logger.log(`[${reqId}] platform=${platform} chunks=${chunks.length} totalTokens=${rows.length}`);

      for (let i = 0; i < chunks.length; i++) {
        const lot = chunks[i];
        const tokensRaw = lot.map((x) => x.token);
        const multicast: admin.messaging.MulticastMessage = {
          ...this.buildCrossPlatformMessage(
            input.title,
            input.body,
            input.imageUrl,
            deepLinkMobile,
            webLink,
            { ...baseData, ...(input.data || {}) },
          ),
          tokens: tokensRaw,
        };

        if (this.DEBUG_PAYLOAD) {
          this.logger.debug(
            `[${reqId}] payload[${platform}#${i + 1}/${chunks.length}] tokens=${tokensRaw.map(this.maskToken.bind(this)).join(',')}`,
          );
        }

        try {
          results.requested += tokensRaw.length;
          const resp = await admin.messaging().sendEachForMulticast(multicast);
          this.logger.log(`[${reqId}] FCM resp platform=${platform}#${i + 1} success=${resp.successCount} failure=${resp.failureCount}`);

          // registrar entregas (dinâmico)
          for (let idx = 0; idx < lot.length; idx++) {
            const t = lot[idx];
            const r = resp.responses[idx];
            const ok = !!r?.success;
            const err = r?.error as any;
            const code = err?.errorInfo?.code || err?.code || '';
            const msgId = r?.messageId;

            try {
              if (cols) {
                await this.insertPushDeliveryDynamic(cols, {
                  companyId: input.companyId,
                  userId: t.userId,
                  platform,
                  token: t.token,
                  provider: 'fcm',
                  channel: 'notify',
                  status: ok ? 'delivered' : 'failed',
                  sentAt: new Date(),
                  deliveredAt: ok ? new Date() : null,
                  meta: { mid: msgId, deepLinkMobile, webLink },
                  error: ok ? null : (code || String(err || '')).slice(0, 512),
                  kind: input.kind,
                  entityId: input.entityId || null,
                  newsId: input.kind === 'NEWS' ? (input.entityId || null) : null,
                });
              }
            } catch (e: any) {
              this.logger.error(`[${reqId}] push_delivery insert error: ${e?.message || e}`);
            }

            if (!ok) {
              results.failure++;
              this.logger.warn(`[${reqId}] fail token=${this.maskToken(t.token)} code=${code || 'unknown'} platform=${platform}`);
            } else {
              results.success++;
            }
          }
        } catch (e: any) {
          this.logger.error(`[${reqId}] FCM error platform=${platform}#${i + 1}: ${e?.message || e}`);
          for (const t of lot) {
            try {
              if (cols) {
                await this.insertPushDeliveryDynamic(cols, {
                  companyId: input.companyId,
                  userId: t.userId,
                  platform,
                  token: t.token,
                  provider: 'fcm',
                  channel: 'notify',
                  status: 'failed',
                  sentAt: new Date(),
                  deliveredAt: null,
                  meta: { deepLinkMobile, webLink },
                  error: (e?.message || String(e || '')).slice(0, 512),
                  kind: input.kind,
                  entityId: input.entityId || null,
                  newsId: input.kind === 'NEWS' ? (input.entityId || null) : null,
                });
              }
            } catch {}
            results.failure++;
          }
        }
      }
    }

    this.logger.log(
      `[${reqId}] done kind=${input.kind} entityId=${input.entityId} requested=${results.requested} success=${results.success} failure=${results.failure}`,
    );
    return results;
  }

  // envio para notícia
  async sendNewsPush(input: {
    companyId: string;
    newsId: string;
    userIds: string[];
    title: string;
    body: string;
    imageUrl?: string;
    deepLinkMobile?: string;
    webLink?: string;
  }) {
    return this.sendPush({
      companyId: input.companyId,
      userIds: input.userIds,
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl,
      deepLinkMobile: input.deepLinkMobile,
      webLink: input.webLink,
      kind: 'NEWS',
      entityId: input.newsId,
    });
  }

  // teste por tokens diretos
  async sendDirectTokens(input: {
    companyId: string;
    tokens: string[];
    title: string;
    body: string;
    imageUrl?: string;
    deepLinkMobile?: string;
    webLink?: string;
    kind: string;
    entityId?: string;
  }) {
    const reqId = Math.random().toString(36).slice(2, 10);
    const by: Record<Platform, string[]> = { android: [], ios: [], web: [] };
    by.android = input.tokens;

    const cols = await this.getPushDeliveryColumns();
    const results = { requested: 0, success: 0, failure: 0 };

    for (const platform of ['android'] as Platform[]) {
      const tokens = by[platform];
      if (!tokens.length) continue;
      const chunks = this.split(tokens, this.CHUNK);

      for (let i = 0; i < chunks.length; i++) {
        const lot = chunks[i];
        const msg: admin.messaging.MulticastMessage = {
          ...this.buildCrossPlatformMessage(
            input.title, input.body, input.imageUrl, input.deepLinkMobile, input.webLink,
            { companyId: input.companyId, kind: input.kind, entityId: input.entityId || '' },
          ),
          tokens: lot,
        };
        try {
          results.requested += lot.length;
          const resp = await admin.messaging().sendEachForMulticast(msg);
          this.logger.log(`[${reqId}] TEST resp success=${resp.successCount} failure=${resp.failureCount}`);
          for (let idx = 0; idx < lot.length; idx++) {
            const tok = lot[idx];
            const r = resp.responses[idx];
            const ok = !!r?.success;
            if (cols) {
              try {
                await this.insertPushDeliveryDynamic(cols, {
                  companyId: input.companyId,
                  userId: null,
                  platform,
                  token: tok,
                  provider: 'fcm',
                  channel: 'notify',
                  status: ok ? 'delivered' : 'failed',
                  sentAt: new Date(),
                  deliveredAt: ok ? new Date() : null,
                  meta: { mid: r?.messageId, deepLinkMobile: input.deepLinkMobile, webLink: input.webLink },
                  error: ok ? null : (r?.error?.code || '').slice(0, 512),
                  kind: input.kind,
                  entityId: input.entityId || null,
                  newsId: input.kind === 'NEWS' ? (input.entityId || null) : null,
                });
              } catch {}
            }
            ok ? results.success++ : results.failure++;
          }
        } catch (e: any) {
          this.logger.error(`[${reqId}] TEST send error: ${e?.message || e}`);
          results.failure += lot.length;
        }
      }
    }
    return results;
  }
}