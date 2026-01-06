// backend/src/modules/notifications/communications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

type Platform = 'web' | 'android' | 'ios';

type SendPushInput = {
  companyId: string;
  userIds: string[];
  title: string;
  body: string;
  imageUrl?: string;
  deepLinkMobile?: string;
  webLink?: string;
  data?: Record<string, string | number | boolean | null | undefined>;
  kind:
  | 'NEWS'
  | 'FORM_PUBLISHED'
  | 'FORM_RESPONSE'
  | 'FORM_CHAT'
  | 'SURVEY_PUBLISHED'
  | string;
  entityId?: string;
  badge?: number;
};

type TokenRow = {
  userId: string;
  platform: Platform;
  token: string;
  id: string;
};

type PushDeliveryRow = {
  companyId?: string;
  userId?: string;
  platform?: string;
  token?: string;
  provider?: string;
  channel?: string;
  status?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  meta?: any; // JSON
  error?: string;
  kind?: string;
  entityId?: string;
  newsId?: string;
};

type SendNewsPushInput = Omit<SendPushInput, 'kind'> & { newsId: string };

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger('CommunicationsService');
  private readonly CHUNK = 500;

  private mailEnabled = false;
  private mailer?: nodemailer.Transporter;
  private mailFrom?: string;

  constructor(private readonly ds: DataSource) {
    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;
    const port = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587;
    const secure =
      process.env.MAIL_SECURE === 'true' || process.env.MAIL_SECURE === '1';
    this.mailFrom = process.env.MAIL_FROM || user;

    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        this.logger.log('communications: Firebase Admin initialized.');
      } catch (e) {
        this.logger.warn('communications: Failed to init Firebase Admin.');
      }
    }

    if (host && user && pass) {
      this.mailer = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.mailEnabled = process.env.MAIL_ENABLED !== '0';
    }
  }

  // ---------------- utils ----------------
  private async tableExists(name: string): Promise<boolean> {
    const r = await this.ds.query(`SELECT to_regclass($1) IS NOT NULL AS x`, [
      `public.${name}`,
    ]);
    return !!r?.[0]?.x;
  }

  private split<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private async getPushDeliveryColumns(): Promise<Set<string> | null> {
    const exists = await this.tableExists('push_delivery');
    if (!exists) return null;
    const rows = await this.ds.query(
      `SELECT a.attname AS col FROM pg_attribute a JOIN pg_class c ON a.attrelid=c.oid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='push_delivery' AND a.attnum>0`,
    );
    return new Set<string>((rows || []).map((r: { col: string }) => r.col));
  }

  private async insertPushDeliveryDynamic(
    cols: Set<string>,
    row: PushDeliveryRow,
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];
    const put = (name: string, value: any) => {
      if (!cols.has(name)) return;
      fields.push(`"${name}"`);
      values.push(value);
      placeholders.push(`$${values.length}`);
    };
    // O ID final será passado explicitamente pela chamada se for NEWS, senão tenta fallback
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
    put('newsId', finalNewsId);

    if (!fields.length) return;
    const sql = `INSERT INTO push_delivery (${fields.join(',')}) VALUES (${placeholders.join(',')})`;
    await this.ds.query(sql, values);
  }

  private buildNewsLinks(newsId: string) {
    const dlTpl = process.env.APP_NEWS_DEEPLINK_TEMPLATE || '';
    const wlTpl = process.env.APP_NEWS_WEBLINK_TEMPLATE || '';
    const deepLinkMobile = dlTpl.replace(':id', newsId);
    const webLink = wlTpl.replace(':id', newsId);
    return { deepLinkMobile, webLink };
  }

  private buildCrossPlatformMessage(
    title: string,
    body: string,
    imageUrl?: string,
    deepLinkMobile?: string,
    webLink?: string,
    dataBase?: Record<string, any>,
    badge?: number,
  ): Omit<admin.messaging.MulticastMessage, 'tokens'> {
    const data: Record<string, string> = {};
    if (dataBase) {
      for (const [k, v] of Object.entries(dataBase)) {
        if (v === undefined || v === null) continue;
        data[k] = String(v);
      }
    }
    if (deepLinkMobile) data['deepLink'] = deepLinkMobile;
    if (badge !== undefined) data['badge'] = String(badge);

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
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            'mutable-content': 1,
            ...(badge !== undefined ? { badge } : {}),
          },
        },
        fcmOptions: { analyticsLabel: 'news_ios' },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon: process.env.FCM_WEB_ICON || undefined,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        fcmOptions: { link: webLink },
      },
    };
  }

  // 🔥 QUERY ESTRITA: Só aceita tokens da empresa correta
  private async fetchTokens(
    companyId: string,
    userIds: string[],
  ): Promise<TokenRow[]> {
    return this.ds.query(
      `SELECT "userId","platform","token","id"
         FROM user_device
        WHERE "enabled"=true
          AND "userId"::text = ANY($2::text[]) 
          AND "companyId" = $1`,
      [companyId, userIds],
    );
  }

  private groupByPlatform(tokens: TokenRow[]) {
    const by: Record<Platform, TokenRow[]> = { web: [], android: [], ios: [] };
    for (const t of tokens) {
      if (
        t.platform === 'web' ||
        t.platform === 'android' ||
        t.platform === 'ios'
      )
        by[t.platform].push(t);
    }
    return by;
  }

  async sendEmail(input: unknown) { }

  async sendPush(input: SendPushInput) {
    const newsIdForLink = input.kind === 'NEWS' ? input.entityId || '' : '';
    const autoLinks = newsIdForLink
      ? this.buildNewsLinks(newsIdForLink)
      : { deepLinkMobile: undefined, webLink: undefined };
    const deepLinkMobile = input.deepLinkMobile ?? autoLinks.deepLinkMobile;
    const webLink = input.webLink ?? autoLinks.webLink;

    const reqId = Math.random().toString(36).slice(2, 10);
    this.logger.log(
      `[${reqId}] sendPush kind=${input.kind} entityId=${input.entityId} users=${input.userIds.length}`,
    );

    const tokens = await this.fetchTokens(input.companyId, input.userIds);
    this.logger.log(`[${reqId}] tokens found=${tokens.length}`);

    if (tokens.length === 0) {
      this.logger.warn(
        `[${reqId}] ⚠️ NENHUM TOKEN ENCONTRADO. Usuário pode não ter registrado ou está em outra empresa.`,
      );
      return { requested: 0, success: 0, failure: 0 };
    }

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
      for (let i = 0; i < chunks.length; i++) {
        const lot = chunks[i];
        const tokensRaw = lot.map((x) => x.token);
        const multicast = {
          ...this.buildCrossPlatformMessage(
            input.title,
            input.body,
            input.imageUrl,
            deepLinkMobile,
            webLink,
            { ...baseData, ...(input.data || {}) },
            input.badge,
          ),
          tokens: tokensRaw,
        };

        try {
          results.requested += tokensRaw.length;
          const resp = await admin.messaging().sendEachForMulticast(multicast);

          // Lista de tokens para remover (Limpeza Automática 🧹)
          const tokensToRemove: string[] = [];

          for (let idx = 0; idx < lot.length; idx++) {
            const response = resp.responses[idx];
            const ok = !!response.success;

            if (ok) {
              results.success++;
            } else {
              results.failure++;
              // 🔥 DETECTAR TOKEN INVÁLIDO E MARCAR PARA REMOVER
              const errCode = response.error?.code;
              if (
                errCode === 'messaging/registration-token-not-registered' ||
                errCode === 'messaging/invalid-argument'
              ) {
                tokensToRemove.push(lot[idx].token);
                this.logger.warn(
                  `[Cleanup] Token inválido detectado para user ${lot[idx].userId}. Será removido.`,
                );
              }
            }

            // Grava o histórico (Push Delivery)
            if (cols) {
              try {
                await this.insertPushDeliveryDynamic(cols, {
                  companyId: input.companyId,
                  userId: lot[idx].userId,
                  platform,
                  token: lot[idx].token,
                  status: ok ? 'delivered' : 'failed',
                  sentAt: new Date(),
                  meta: { deepLinkMobile },
                  kind: input.kind,
                  entityId: input.entityId,
                  newsId: input.kind === 'NEWS' ? input.entityId : null,
                });
              } catch (e) {
                this.logger.error(`DB Error push_delivery: ${e}`);
              }
            }
          }

          // 🔥 EXECUTA A LIMPEZA DOS TOKENS MORTOS
          if (tokensToRemove.length > 0) {
            await this.ds.query(
              `DELETE FROM user_device WHERE token = ANY($1::text[])`,
              [tokensToRemove],
            );
          }
        } catch (e) {
          this.logger.error(`[${reqId}] FCM error: ${e}`);
        }
      }
    }
    return results;
  }

  async sendNewsPush(input: SendNewsPushInput) {
    return this.sendPush({ ...input, kind: 'NEWS', entityId: input.newsId });
  }
  async sendDirectTokens(input: unknown) {
    return { requested: 0, success: 0, failure: 0 };
  }
}
