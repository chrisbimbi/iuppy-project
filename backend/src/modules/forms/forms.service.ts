import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { FormEntity } from './entities/form.entity'
import { FormFieldEntity } from './entities/form-field.entity'
import { FormSubmissionEntity } from './entities/form-submission.entity'
import { FormAnswerEntity } from './entities/form-answer.entity'
import { FormAttachmentEntity } from './entities/form-attachment.entity'
import { FormRhActionEntity } from './entities/form-rh-action.entity'
import { CreateFormDto } from './dto/create-form.dto'
import { UpdateFormDto } from './dto/update-form.dto'
import { CreateSubmissionDto } from './dto/create-submission.dto'
import { RespondDto } from './dto/respond.dto'
import { CommunicationsService } from 'src/notifications/communications.service'

@Injectable()
export class FormsService {
  private readonly log = new Logger(FormsService.name)

  constructor(
    @InjectRepository(FormEntity) private readonly formRepo: Repository<FormEntity>,
    @InjectRepository(FormFieldEntity) private readonly fieldRepo: Repository<FormFieldEntity>,
    @InjectRepository(FormSubmissionEntity) private readonly subRepo: Repository<FormSubmissionEntity>,
    @InjectRepository(FormAnswerEntity) private readonly ansRepo: Repository<FormAnswerEntity>,
    @InjectRepository(FormAttachmentEntity) private readonly attRepo: Repository<FormAttachmentEntity>,
    @InjectRepository(FormRhActionEntity) private readonly rhRepo: Repository<FormRhActionEntity>,
    private readonly ds: DataSource,
    private readonly comms: CommunicationsService,
  ) {}

  /** === SEGMENTOS (Spaces/Groups) para o Passo 1 === */
  async segments(companyId: string) {
    const reg = async (t: string) =>
      (await this.ds.query(`SELECT to_regclass($1) AS t`, [t]))?.[0]?.t ? t : null

    const tSpace = (await reg('public.space')) || (await reg('public.spaces'))
    const tGroup = (await reg('public."group"')) || (await reg('public.groups'))

    const spaces = tSpace
      ? await this.ds.query(
          `SELECT id, name FROM ${tSpace} WHERE "companyId"=$1 AND COALESCE(active,true)=true ORDER BY name ASC`,
          [companyId],
        )
      : []

    const groups = tGroup
      ? await this.ds.query(
          `SELECT id, name FROM ${tGroup} WHERE "companyId"=$1 ORDER BY name ASC`,
          [companyId],
        )
      : []

    return { spaces, groups }
  }

  async createForm(companyId: string, createdBy: string, dto: CreateFormDto) {
    if (companyId !== dto.companyId) throw new ForbiddenException('companyId mismatch')

    const form = this.formRepo.create({
      ...dto,
      createdBy,
      scheduleStartAt: dto.scheduleStartAt ? new Date(dto.scheduleStartAt) : null,
      scheduleEndAt: dto.scheduleEndAt ? new Date(dto.scheduleEndAt) : null,
      deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
      publishedAt: dto.status === 'published' ? new Date() : null,
      version: 1,
    })
    await this.formRepo.save(form)

    let order = 0
    for (const f of dto.fields || []) {
      const field = this.fieldRepo.create({
        companyId,
        formId: form.id,
        version: 1,
        type: f.type,
        label: f.label,
        required: !!f.required,
        options: f.options || null,
        order: f.order ?? order++,
      })
      await this.fieldRepo.save(field)
    }

    return this.getForm(companyId, form.id)
  }

  async getForm(companyId: string, formId: string) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } })
    if (!form) throw new NotFoundException('form not found')
    const fields = await this.fieldRepo.find({
      where: { companyId, formId, version: form.version || 1 },
      order: { order: 'ASC' as any },
    })
    return { ...form, fields }
  }

  /** LISTAGEM com contagem de perguntas (versão atual) e de submissões */
  async listForms(companyId: string, status?: string) {
    const params: any[] = [companyId]
    const statusWhere = status ? 'AND f.status = $2' : ''
    if (status) params.push(status)

    const rows = await this.ds.query(
      `
      SELECT
        f.*,
        (
          SELECT COUNT(*)
            FROM form_field ff
           WHERE ff."companyId" = f."companyId"
             AND ff."formId"     = f.id
             AND ff."version"    = f.version
        )::int AS "questionsCount",
        (
          SELECT COUNT(*)
            FROM form_submission s
           WHERE s."companyId" = f."companyId"
             AND s."formId"     = f.id
        )::int AS "submissionsCount"
      FROM form f
      WHERE f."companyId" = $1
        ${statusWhere}
      ORDER BY f."createdAt" DESC
      `,
      params,
    )

    return rows
  }

  async updateForm(companyId: string, formId: string, dto: UpdateFormDto) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } })
    if (!form) throw new NotFoundException('form not found')

    const patched = Object.assign(form, {
      ...dto,
      scheduleStartAt: dto.scheduleStartAt === undefined ? form.scheduleStartAt : (dto.scheduleStartAt ? new Date(dto.scheduleStartAt) : null),
      scheduleEndAt: dto.scheduleEndAt === undefined ? form.scheduleEndAt : (dto.scheduleEndAt ? new Date(dto.scheduleEndAt) : null),
      deadlineAt: dto.deadlineAt === undefined ? form.deadlineAt : (dto.deadlineAt ? new Date(dto.deadlineAt) : null),
      publishedAt: dto.status === 'published' && !form.publishedAt ? new Date() : form.publishedAt,
    })
    await this.formRepo.save(patched)

    if (dto.fields) {
      const nextVersion = (form.version || 1) + 1
      await this.ds.transaction(async (em) => {
        await em.update(FormEntity, { id: formId }, { version: nextVersion })
        let order = 0
        for (const f of dto.fields!) {
          const row = em.create(FormFieldEntity, {
            companyId, formId, version: nextVersion,
            type: f.type, label: f.label, required: !!f.required, options: f.options || null, order: f.order ?? order++,
          })
          await em.save(FormFieldEntity, row)
        }
      })
    }

    return this.getForm(companyId, formId)
  }

  async submit(companyId: string, formId: string, userId: string | null, dto: CreateSubmissionDto) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } })
    if (!form) throw new NotFoundException('form not found')

    const submittedAt = new Date()
    const isOnTime = form.deadlineAt ? (submittedAt.getTime() <= new Date(form.deadlineAt).getTime()) : null

    const sub = this.subRepo.create({
      companyId, formId, submittedAt,
      userId: form.anonymous ? null : (dto.external ? null : userId),
      external: !!dto.external,
      externalEmail: dto.externalEmail || null,
      spaceIds: dto.spaceIds || [],
      groupIds: dto.groupIds || [],
      isOnTime,
      status: 'pending',
      replyCount: 0,
      fileCount: dto.attachments?.length || 0,
      meta: dto.meta || null,
    })
    await this.subRepo.save(sub)

    for (const a of dto.answers || []) {
      await this.ansRepo.save(this.ansRepo.create({
        companyId, submissionId: sub.id, formId, fieldId: a.fieldId, type: a.type, value: a.value,
      }))
    }

    for (const at of dto.attachments || []) {
      await this.attRepo.save(this.attRepo.create({
        companyId, submissionId: sub.id, formId, storagePath: at.storagePath, mimeType: at.mimeType, bytes: String(at.bytes), uploadedAt: new Date(), status: 'ok', error: null,
      }))
    }

    return { submissionId: sub.id, submittedAt, isOnTime }
  }

  async listSubmissions(companyId: string, formId: string, page = 1, pageSize = 50) {
    const [items, total] = await this.subRepo.findAndCount({
      where: { companyId, formId },
      order: { submittedAt: 'DESC' as any, createdAt: 'DESC' as any },
      take: pageSize, skip: (page-1)*pageSize,
    })
    return { total, page, pageSize, items }
  }

  async respond(companyId: string, formId: string, submissionId: string, actorUserId: string, dto: RespondDto) {
    const sub = await this.subRepo.findOne({ where: { id: submissionId, formId, companyId } })
    if (!sub) throw new NotFoundException('submission not found')

    await this.rhRepo.save(this.rhRepo.create({
      companyId, formId, submissionId, actorUserId, type: dto.type, message: dto.message || null,
    }))

    let newStatus = sub.status
    if (dto.type === 'approve') newStatus = 'approved'
    else if (dto.type === 'reject') newStatus = 'rejected'
    else if (dto.type === 'reply') newStatus = 'replied'

    await this.subRepo.update({ id: submissionId }, { status: newStatus, replyCount: () => `"replyCount"+1` as any })

    if (sub.userId && !sub.external) {
      try {
        await this.comms.sendPush({
          companyId,
          userIds: [sub.userId],
          title: 'Resposta enviada',
          body: 'Seu formulário recebeu uma resposta do RH.',
          deepLinkMobile: `iuppy://forms/${formId}/submissions/${submissionId}`,
          kind: 'FORM_REPLY',
          data: { formId, submissionId },
        })
      } catch (e) {
        this.log.warn(`push error: ${String(e)}`)
      }
    }

    return { ok: true }
  }
}