import { Injectable, Inject, Logger } from '@nestjs/common'
import { DataSource, In, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import * as admin from 'firebase-admin'
import { FIREBASE_MESSAGING } from './firebase-admin.provider'
import { UserDeviceEntity } from './entities/user-device.entity'
import { SchemaIntrospectorV2 } from 'src/v2/common/schema-introspector.v2'

type Platform = 'web' | 'android' | 'ios'
type Messaging = admin.messaging.Messaging
type MulticastMessage = admin.messaging.MulticastMessage

export type SendPushInput = {
  companyId: string
  userIds: string[]
  title: string
  body: string
  imageUrl?: string | null
  deepLink?: string | null
  data?: Record<string, string | number | boolean | null | undefined>
  kind: 'NEWS' | 'SURVEY' | 'FORM' | 'ONBOARDING' | string
  entityId?: string
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name)

  constructor(
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
    @InjectRepository(UserDeviceEntity) private readonly deviceRepo: Repository<UserDeviceEntity>,
    @Inject(FIREBASE_MESSAGING) private readonly fcm: Messaging,
  ) { }

  async getTokens(
    companyId: string,
    userIds: string[],
  ): Promise<Array<{ userId: string; platform: Platform; token: string }>> {
    if (!userIds.length) return []
    const rows = await this.deviceRepo.find({
      where: { companyId, userId: In(userIds), enabled: true },
      select: ['userId', 'platform', 'token'],
    })
    const seen = new Set<string>()
    return rows.filter((r) => {
      if (!r.token) return false
      if (seen.has(r.token)) return false
      seen.add(r.token)
      return true
    })
  }

  private chunk<T>(arr: T[], size = 500): T[][] {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
  }

  private makeMessage(platform: Platform, tokens: string[], input: SendPushInput): MulticastMessage {
    const { title, body, imageUrl, deepLink, data, kind, entityId, companyId } = input
    const commonData: Record<string, string> = {
      companyId,
      kind,
      ...(entityId ? { entityId } : {}),
      ...(data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])) : {}),
      ...(deepLink ? { deeplink: deepLink } : {}),
    }

    return {
      tokens,
      notification: { title, body, imageUrl: imageUrl || undefined },
      data: commonData,
      android: {
        priority: 'high',
        notification: {
          imageUrl: imageUrl || undefined,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'default',
        },
        fcmOptions: { analyticsLabel: 'news_push' },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { alert: { title, body }, 'mutable-content': 1, sound: 'default' } },
        fcmOptions: { imageUrl: imageUrl || undefined, analyticsLabel: 'news_push' } as any,
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192.png',
          image: imageUrl || undefined,
        },
        fcmOptions: deepLink ? { link: deepLink } : undefined,
        headers: { Urgency: 'high' },
      },
    }
  }

  private async detectPushDeliveryShape(): Promise<
    | { shape: 'rich'; hasOpenedAt: boolean }
    | { shape: 'simple' }
    | null
  > {
    const has = await this.schema.hasTable('push_delivery')
    if (!has) return null

    const richCols = await Promise.all([
      this.schema.hasColumn('push_delivery', 'status'),
      this.schema.hasColumn('push_delivery', 'channel'),
      this.schema.hasColumn('push_delivery', 'provider'),
      this.schema.hasColumn('push_delivery', 'token'),
      this.schema.hasColumn('push_delivery', 'sentAt'),
      this.schema.hasColumn('push_delivery', 'deliveredAt'),
      this.schema.hasColumn('push_delivery', 'meta'),
      this.schema.hasColumn('push_delivery', 'error'),
    ])
    const isRich = richCols.every(Boolean)
    if (isRich) {
      const hasOpenedAt = await this.schema.hasColumn('push_delivery', 'openedAt')
      return { shape: 'rich', hasOpenedAt }
    }

    const simpleCols = await Promise.all([
      this.schema.hasColumn('push_delivery', 'messageId'),
      this.schema.hasColumn('push_delivery', 'platform'),
      this.schema.hasColumn('push_delivery', 'token'),
      this.schema.hasColumn('push_delivery', 'deliveredAt'),
    ])
    if (simpleCols.every(Boolean)) return { shape: 'simple' }

    return null
  }

  private async insertDeliveriesSimple(rows: Array<{
    companyId: string
    newsId: string | null
    userId: string
    platform: string | null
    token: string
    messageId: string | null
    deliveredAt: Date
  }>) {
    if (!rows.length) return
    const values = rows.map(() => `($1,$2,$3,$4,$5,$6,$7)`).join(',')
    const params: any[] = []
    rows.forEach((v) => params.push(v.companyId, v.newsId, v.userId, v.platform, v.token, v.messageId, v.deliveredAt))
    await this.ds.query(
      `INSERT INTO push_delivery ("companyId","newsId","userId","platform","token","messageId","deliveredAt")
       VALUES ${values}`,
      params,
    )
  }

  private async insertDeliveriesRich(rows: Array<{
    companyId: string
    newsId: string | null
    userId: string
    token: string
    providerMsgId: string | null
    sentAt: Date
    deliveredAt: Date | null
    meta?: any
  }>) {
    if (!rows.length) return
    const values = rows.map(() => `($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`).join(',')
    const params: any[] = []
    rows.forEach((v) =>
      params.push(
        v.companyId,
        v.newsId,
        v.userId,
        'notify',
        'fcm',
        v.token,
        'delivered',
        v.sentAt,
        v.deliveredAt,
        JSON.stringify({ mid: v.providerMsgId, ...(v.meta || {}) }),
      ),
    )
    await this.ds.query(
      `INSERT INTO push_delivery ("companyId","newsId","userId","channel","provider","token","status","sentAt","deliveredAt","meta")
       VALUES ${values}`,
      params,
    )
  }

  private async persistDeliveries(
    shape: Awaited<ReturnType<CommunicationsService['detectPushDeliveryShape']>>,
    items: Array<{
      companyId: string
      newsId: string | null
      userId: string
      platform: Platform | null
      token: string
      messageId: string | null
      sentAt: Date
      deliveredAt: Date | null
    }>,
  ) {
    if (!shape || !items.length) return
    if (shape.shape === 'simple') {
      await this.insertDeliveriesSimple(
        items.map((i) => ({
          companyId: i.companyId,
          newsId: i.newsId,
          userId: i.userId,
          platform: i.platform,
          token: i.token,
          messageId: i.messageId,
          deliveredAt: i.deliveredAt || i.sentAt,
        })),
      )
      return
    }

    await this.insertDeliveriesRich(
      items.map((i) => ({
        companyId: i.companyId,
        newsId: i.newsId,
        userId: i.userId,
        token: i.token,
        providerMsgId: i.messageId,
        sentAt: i.sentAt,
        deliveredAt: i.deliveredAt,
      })),
    )
  }

  async sendPush(input: SendPushInput) {
    const { companyId, userIds, kind, entityId } = input
    if (!userIds.length) return { requested: 0, success: 0, failure: 0 }

    const tokenRows = await this.getTokens(companyId, userIds)
    if (!tokenRows.length) return { requested: 0, success: 0, failure: 0 }

    const now = new Date()
    const byPlatform = new Map<Platform, string[]>()
    tokenRows.forEach((t) => {
      if (!byPlatform.has(t.platform)) byPlatform.set(t.platform, [])
      byPlatform.get(t.platform)!.push(t.token)
    })

    const tokenToUser = new Map<string, string>()
    tokenRows.forEach((t) => tokenToUser.set(t.token, t.userId))

    const shape = await this.detectPushDeliveryShape()

    let success = 0
    let failure = 0
    const deliveries: Array<{
      companyId: string
      newsId: string | null
      userId: string
      platform: Platform | null
      token: string
      messageId: string | null
      sentAt: Date
      deliveredAt: Date | null
    }> = []

    for (const [platform, list] of byPlatform.entries()) {
      // batches de até 500
      for (let i = 0; i < list.length; i += 500) {
        const batch = list.slice(i, i + 500)
        const res = await this.fcm.sendEachForMulticast(this.makeMessage(platform, batch, input))

        res.responses.forEach((r, idx) => {
          const token = batch[idx]
          const userId = tokenToUser.get(token)
          if (!userId) return
          if (r.success) {
            success++
            deliveries.push({
              companyId,
              newsId: (kind === 'NEWS' ? (entityId || null) : null) as string | null,
              userId,
              platform,
              token,
              messageId: r.messageId || null,
              sentAt: now,
              deliveredAt: now,
            })
          } else {
            failure++
          }
        })

        const invalidTokens: string[] = []
        res.responses.forEach((r, idx) => {
          if (!r.success) {
            const code = (r.error && (r.error as any).code) || ''
            if (
              code.includes('registration-token-not-registered') ||
              code.includes('invalid-argument') ||
              code.includes('invalid-registration-token')
            ) {
              invalidTokens.push(batch[idx])
            }
          }
        })
        if (invalidTokens.length) {
          await this.ds.query(
            `UPDATE user_device SET enabled=false, "disabledAt"=NOW() WHERE "companyId"=$1 AND token = ANY($2::text[])`,
            [companyId, invalidTokens],
          )
        }
      }
    }

    await this.persistDeliveries(shape, deliveries)
    return { requested: tokenRows.length, success, failure }
  }

  async sendNewsPush(args: {
    companyId: string
    newsId: string
    userIds: string[]
    title: string
    body: string
    imageUrl?: string | null
    deepLink?: string | null
  }) {
    return this.sendPush({
      companyId: args.companyId,
      userIds: args.userIds,
      title: args.title,
      body: args.body,
      imageUrl: args.imageUrl,
      deepLink: args.deepLink,
      kind: 'NEWS',
      entityId: args.newsId,
      data: { newsId: args.newsId },
    })
  }
}