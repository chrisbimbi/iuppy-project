// backend/src/v2/forms/forms.service.ts
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'

type FormStatus = 'draft' | 'published' | 'expired' | 'archived'

export type FormUpsertPayload = {
    title: string
    description?: string | null
    // 🔥 Segmentação
    audienceAllCompany?: boolean
    audienceSpaceIds?: string[]
    audienceGroupIds?: string[]
    anonymous?: boolean
    allowExternal?: boolean

    // ⚙️ Comportamento/fluxo
    requiresApproval?: boolean
    allowMultipleSubmissions?: boolean

    // 📅 Agenda & deadline
    status?: FormStatus
    scheduleStartAt?: string | null
    scheduleEndAt?: string | null
    deadlineAt?: string | null

    // 🔔 Lembretes & notificações
    remindersEnabled?: boolean
    remindersConfig?: { offsets?: string[] } | null
    notificationsConfig?: { push?: boolean; email?: boolean } | null

    // 📎 Anexos
    attachmentsAllowed?: boolean
    attachmentHelpText?: string | null

    // 👥 ACL
    acl?: any

    // 🧩 Campos (passo 3)
    fields?: Array<{
        id?: string
        type:
        | 'short_text'
        | 'long_text'
        | 'number'
        | 'date'
        | 'multi_choice'
        | 'single_choice'
        | 'stars'
        | 'scale'
        label: string
        required?: boolean
        options?: any
        order: number
    }>
}

@Injectable()
export class FormsService {
    constructor(private readonly ds: DataSource) { }

    /** Util: normaliza “empresa inteira” => arrays vazios */
    private normalizeAudience(payload: Partial<FormUpsertPayload>) {
        const all = !!payload.audienceAllCompany
        return {
            spaceIds: all ? [] : (payload.audienceSpaceIds ?? []),
            groupIds: all ? [] : (payload.audienceGroupIds ?? []),
        }
    }

    async list(companyId: string) {
        // fieldCount atrelado à versão atual do formulário
        const sql = `
      SELECT
        f.id,
        f."companyId",
        f.title,
        f.description,
        f.status,
        f."scheduleStartAt",
        f."scheduleEndAt",
        f."deadlineAt",
        f."allowMultipleSubmissions",
        f.anonymous,
        f."allowExternal",
        f."audienceSpaceIds",
        f."audienceGroupIds",
        f."attachmentsAllowed",
        f."attachmentHelpText",
        f."remindersConfig",
        f."notificationsConfig",
        f.acl,
        f."createdBy",
        f."publishedAt",
        f.version,
        f."createdAt",
        f."updatedAt",
        (
          SELECT COUNT(*)
            FROM form_field ff
           WHERE ff."companyId" = f."companyId"
             AND ff."formId" = f.id
             AND ff."version" = f.version
        ) AS "fieldCount"
      FROM form f
      WHERE f."companyId" = $1
      ORDER BY f."createdAt" DESC
      LIMIT 200
    `
        const rows = await this.ds.query(sql, [companyId])
        return rows
    }

    async get(companyId: string, formId: string) {
        const form = await this.ds.query(
            `SELECT *
         FROM form
        WHERE "companyId"=$1 AND id=$2
        LIMIT 1`,
            [companyId, formId],
        )
        if (!form?.[0]) throw new NotFoundException('Form not found')
        const fields = await this.ds.query(
            `SELECT *
         FROM form_field
        WHERE "companyId"=$1 AND "formId"=$2
        ORDER BY "order" ASC`,
            [companyId, formId],
        )
        const ret = { ...form[0], fields }
        // audienceAllCompany = true se arrays vazios
        return {
            ...ret,
            audienceAllCompany:
                (ret.audienceSpaceIds?.length ?? 0) === 0 &&
                (ret.audienceGroupIds?.length ?? 0) === 0,
        }
    }

    async create(companyId: string, userId: string, body: FormUpsertPayload) {
        if (!body?.title?.trim()) throw new BadRequestException('title required')

        const { spaceIds, groupIds } = this.normalizeAudience(body)
        const result = await this.ds.query(
            `INSERT INTO form
         ("companyId","title","description","status",
          "scheduleStartAt","scheduleEndAt","deadlineAt",
          "allowMultipleSubmissions","anonymous","allowExternal",
          "attachmentsAllowed","attachmentHelpText",
          "remindersConfig","notificationsConfig","acl","createdBy","requiresApproval",
          "audienceSpaceIds","audienceGroupIds","version")
       VALUES ($1,$2,$3,$4,
               $5,$6,$7,
               COALESCE($8,false),COALESCE($9,false),COALESCE($10,false),
               COALESCE($11,false),$12,
               $13,$14,$15,$16,COALESCE($17,false),
               $18,$19,1)
       RETURNING id`,
            [
                companyId,
                body.title,
                body.description ?? null,
                body.status ?? 'draft',
                body.scheduleStartAt ?? null,
                body.scheduleEndAt ?? null,
                body.deadlineAt ?? null,
                !!body.allowMultipleSubmissions,
                !!body.anonymous,
                !!body.allowExternal,
                !!body.attachmentsAllowed,
                body.attachmentHelpText ?? null,
                body.remindersEnabled ? (body.remindersConfig ?? { offsets: [] }) : null,
                body.notificationsConfig ?? { push: true, email: false },
                body.acl ?? { owners: [userId], editors: [], viewers: [] },
                userId,
                !!body.requiresApproval,
                spaceIds,
                groupIds,
            ],
        )
        const formId = result?.[0]?.id as string

        // Campos (opcional)
        if (Array.isArray(body.fields) && body.fields.length > 0) {
            for (const f of body.fields) {
                await this.ds.query(
                    `INSERT INTO form_field
            ("id","companyId","formId","version","type","label","required","options","order","createdAt")
           VALUES (gen_random_uuid(), $1, $2, 1, $3, $4, COALESCE($5,false), $6, $7, NOW())`,
                    [companyId, formId, f.type, f.label, !!f.required, f.options ?? null, f.order ?? 1],
                )
            }
        }

        return { id: formId }
    }

    async update(companyId: string, formId: string, body: Partial<FormUpsertPayload>) {
        // Atualiza cabecalho do form
        const current = await this.get(companyId, formId)
        const { spaceIds, groupIds } = this.normalizeAudience(body)

        await this.ds.query(`START TRANSACTION`)
        try {
            await this.ds.query(
                `UPDATE form
            SET "title"=COALESCE($3,"title"),
                "description"=$4,
                "status"=COALESCE($5,"status"),
                "scheduleStartAt"=$6,
                "scheduleEndAt"=$7,
                "deadlineAt"=$8,
                "allowMultipleSubmissions"=COALESCE($9,"allowMultipleSubmissions"),
                "anonymous"=COALESCE($10,"anonymous"),
                "allowExternal"=COALESCE($11,"allowExternal"),
                "attachmentsAllowed"=COALESCE($12,"attachmentsAllowed"),
                "attachmentHelpText"=$13,
                "remindersConfig"=$14,
                "notificationsConfig"=$15,
                "acl"=COALESCE($16,"acl"),
                "requiresApproval"=COALESCE($17,"requiresApproval"),
                "audienceSpaceIds"=$18,
                "audienceGroupIds"=$19,
                "version"="version"+1,
                "updatedAt"=NOW()
          WHERE "companyId"=$1 AND id=$2`,
                [
                    companyId,
                    formId,
                    body.title,
                    body.description ?? current.description ?? null,
                    body.status,
                    body.scheduleStartAt ?? null,
                    body.scheduleEndAt ?? null,
                    body.deadlineAt ?? null,
                    body.allowMultipleSubmissions,
                    body.anonymous,
                    body.allowExternal,
                    body.attachmentsAllowed,
                    body.attachmentHelpText ?? null,
                    body.remindersEnabled ? (body.remindersConfig ?? { offsets: [] }) : null,
                    body.notificationsConfig ?? current.notificationsConfig ?? { push: true, email: false },
                    body.acl,
                    body.requiresApproval,
                    spaceIds,
                    groupIds,
                ],
            )

            // Atualização dos campos (se vier “fields”, substitui versão = versão+1)
            if (Array.isArray(body.fields)) {
                // deprecamos versão anterior mantendo histórico (versão é do form_field)
                const nextVersionRow = await this.ds.query(
                    `SELECT COALESCE(MAX(version),1)+1 AS v FROM form_field WHERE "companyId"=$1 AND "formId"=$2`,
                    [companyId, formId],
                )
                const v = Number(nextVersionRow?.[0]?.v || 2)

                // remove rascunhos conflituosos? — vamos só inserir nova versão
                for (const f of body.fields) {
                    await this.ds.query(
                        `INSERT INTO form_field
              ("id","companyId","formId","version","type","label","required","options","order","createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, COALESCE($6,false), $7, $8, NOW())`,
                        [companyId, formId, v, f.type, f.label, !!f.required, f.options ?? null, f.order ?? 1],
                    )
                }
            }

            await this.ds.query(`COMMIT`)
        } catch (e) {
            await this.ds.query(`ROLLBACK`)
            throw e
        }
        return { ok: true }
    }

    async publish(companyId: string, formId: string) {
        await this.ds.query(
            `UPDATE form SET status='published', "publishedAt"=COALESCE("publishedAt", NOW()), "updatedAt"=NOW(), "version"="version"+1
        WHERE "companyId"=$1 AND id=$2`,
            [companyId, formId],
        )
        return { ok: true }
    }

    async unpublish(companyId: string, formId: string) {
        await this.ds.query(
            `UPDATE form SET status='draft', "updatedAt"=NOW(), "version"="version"+1
        WHERE "companyId"=$1 AND id=$2`,
            [companyId, formId],
        )
        return { ok: true }
    }

    async duplicate(companyId: string, formId: string, actorUserId: string) {
        const f = await this.get(companyId, formId)
        const title = `${f.title} (cópia)`

        const ins = await this.ds.query(
            `INSERT INTO form
        ("companyId","title","description","status",
         "scheduleStartAt","scheduleEndAt","deadlineAt",
         "allowMultipleSubmissions","anonymous","allowExternal",
         "attachmentsAllowed","attachmentHelpText",
         "remindersConfig","notificationsConfig","acl","createdBy","requiresApproval",
         "audienceSpaceIds","audienceGroupIds","version")
       VALUES ($1,$2,$3,'draft',
               $4,$5,$6,
               $7,$8,$9,
               $10,$11,
               $12,$13,$14,$15,$16,
               $17,$18,1)
       RETURNING id`,
            [
                companyId,
                title,
                f.description ?? null,
                f.scheduleStartAt ?? null,
                f.scheduleEndAt ?? null,
                f.deadlineAt ?? null,
                !!f.allowMultipleSubmissions,
                !!f.anonymous,
                !!f.allowExternal,
                !!f.attachmentsAllowed,
                f.attachmentHelpText ?? null,
                f.remindersConfig ?? null,
                f.notificationsConfig ?? { push: true, email: false },
                f.acl ?? { owners: [actorUserId], editors: [], viewers: [] },
                actorUserId,
                !!f.requiresApproval,
                f.audienceSpaceIds ?? [],
                f.audienceGroupIds ?? [],
            ],
        )
        const newId = ins?.[0]?.id as string

        // clona última versão de fields
        const lastVersionRow = await this.ds.query(
            `SELECT COALESCE(MAX(version),1) AS v FROM form_field WHERE "companyId"=$1 AND "formId"=$2`,
            [companyId, formId],
        )
        const v = Number(lastVersionRow?.[0]?.v || 1)
        const fields = await this.ds.query(
            `SELECT type,label,required,options,"order"
         FROM form_field
        WHERE "companyId"=$1 AND "formId"=$2 AND version=$3
        ORDER BY "order" ASC`,
            [companyId, formId, v],
        )
        for (const fl of fields) {
            await this.ds.query(
                `INSERT INTO form_field
          ("id","companyId","formId","version","type","label","required","options","order","createdAt")
         VALUES (gen_random_uuid(), $1, $2, 1, $3, $4, $5, $6, $7, NOW())`,
                [companyId, newId, fl.type, fl.label, !!fl.required, fl.options ?? null, fl.order ?? 1],
            )
        }

        return { id: newId }
    }

    async removeMany(companyId: string, ids: string[]) {
        if (!Array.isArray(ids) || ids.length === 0) return { ok: true, deleted: 0 }
        const res = await this.ds.query(
            `DELETE FROM form WHERE "companyId"=$1 AND id = ANY($2::uuid[])`,
            [companyId, ids],
        )
        return { ok: true, deleted: res?.rowCount ?? 0 }
    }

    /** Opções de segmentação (Spaces/Groups) — compatível com bancos legados */
    async segmentationOptions(companyId: string) {
        // Tenta várias variações de tabela/coluna para "space"
        const tryOne = async (sql: string, params: any[]) => {
            try { return await this.ds.query(sql, params) } catch { return [] }
        }

        // Spaces
        let spaces = await tryOne(
            `SELECT s.id, s.name
         FROM "space" s
        WHERE s."companyId"=$1 AND COALESCE(s."active", true)=true
        ORDER BY COALESCE(s."position", 9999), s.name ASC`,
            [companyId],
        )
        if (!spaces?.length) {
            spaces = await tryOne(
                `SELECT s.id, s.name FROM "spaces" s WHERE s."companyId"=$1 ORDER BY s.name ASC`,
                [companyId],
            )
        }

        // Groups
        const groups = await tryOne(
            `SELECT g.id, COALESCE(g.name, g.title) AS name
         FROM "group" g
        WHERE g."companyId"=$1
        ORDER BY name ASC`,
            [companyId],
        )

        return { spaces, groups }
    }

    /** Submissões (inbox básica da S1) */
    async submissions(companyId: string, formId: string, page = 1, pageSize = 50) {
        const items = await this.ds.query(
            `SELECT s.id AS "submissionId", s."submittedAt", s.status, s."isOnTime",
              s.external, s."externalEmail", s."fileCount",
              s."userId"
         FROM form_submission s
        WHERE s."companyId"=$1 AND s."formId"=$2
        ORDER BY s."submittedAt" DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
            [companyId, formId],
        )
        const totalRow = await this.ds.query(
            `SELECT COUNT(*) FROM form_submission WHERE "companyId"=$1 AND "formId"=$2`,
            [companyId, formId],
        )
        return { total: Number(totalRow?.[0]?.count || 0), page, pageSize, items }
    }

    /** Responder/Aprovar/Reprovar (gera ação + push) */
    async respond(companyId: string, formId: string, submissionId: string, actorUserId: string, payload: { type: 'reply' | 'approve' | 'reject', message?: string }) {
        const form = await this.get(companyId, formId)
        const sub = await this.ds.query(
            `SELECT s.id, s."userId", s.external, s."externalEmail"
         FROM form_submission s
        WHERE s."companyId"=$1 AND s."formId"=$2 AND s.id=$3
        LIMIT 1`,
            [companyId, formId, submissionId],
        )
        if (!sub?.[0]) throw new NotFoundException('submission not found')

        if ((payload.type === 'approve' || payload.type === 'reject') && !form.requiresApproval) {
            throw new ForbiddenException('Form does not require approval')
        }

        // registra ação RH
        await this.ds.query(
            `INSERT INTO form_rh_action
        (id,"companyId","submissionId","formId","actorUserId","type","message","createdAt")
       VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6, NOW())`,
            [companyId, submissionId, formId, actorUserId, payload.type, payload.message ?? null],
        )

        // Atualiza status da submissão conforme ação
        if (payload.type === 'reply') {
            await this.ds.query(
                `UPDATE form_submission SET status='replied' WHERE "companyId"=$1 AND id=$2`,
                [companyId, submissionId],
            )
        } else if (payload.type === 'approve') {
            await this.ds.query(
                `UPDATE form_submission SET status='approved' WHERE "companyId"=$1 AND id=$2`,
                [companyId, submissionId],
            )
        } else if (payload.type === 'reject') {
            await this.ds.query(
                `UPDATE form_submission SET status='rejected' WHERE "companyId"=$1 AND id=$2`,
                [companyId, submissionId],
            )
        }

        // cria evento de notificação (infra existente pega esse log)
        await this.ds.query(
            `INSERT INTO notification_event
        ("companyId","objectType","objectId","channel","type","userId","externalEmail","latencyMs","status","meta","ts")
       VALUES ($1,'form',$2,'push','sent',$3,$4,NULL,NULL,$5,NOW())`,
            [
                companyId,
                formId,
                sub[0].userId ?? null,
                sub[0].external ? sub[0].externalEmail ?? null : null,
                { submissionId, action: payload.type, preview: (payload.message ?? '').slice(0, 120) },
            ],
        )

        return { ok: true }
    }
}