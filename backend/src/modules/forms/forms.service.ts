// src/modules/forms/forms.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FormEntity } from './entities/form.entity';
import { FormFieldEntity } from './entities/form-field.entity';
import { FormSubmissionEntity } from './entities/form-submission.entity';
import { FormAnswerEntity } from './entities/form-answer.entity';
import { FormAttachmentEntity } from './entities/form-attachment.entity';
import { FormRhActionEntity } from './entities/form-rh-action.entity';
import { FormNotificationSettingEntity } from './entities/form-notification-setting.entity';
import { FormBadgeStateEntity } from './entities/form-badge-state.entity';

import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { RespondDto } from './dto/respond.dto';
import { CommunicationsService } from '../../notifications/communications.service';

@Injectable()
export class FormsService {
  private readonly log = new Logger(FormsService.name);

  constructor(
    @InjectRepository(FormEntity)
    private readonly formRepo: Repository<FormEntity>,
    @InjectRepository(FormFieldEntity)
    private readonly fieldRepo: Repository<FormFieldEntity>,
    @InjectRepository(FormSubmissionEntity)
    private readonly subRepo: Repository<FormSubmissionEntity>,
    @InjectRepository(FormAnswerEntity)
    private readonly ansRepo: Repository<FormAnswerEntity>,
    @InjectRepository(FormAttachmentEntity)
    private readonly attRepo: Repository<FormAttachmentEntity>,
    @InjectRepository(FormRhActionEntity)
    private readonly rhRepo: Repository<FormRhActionEntity>,
    @InjectRepository(FormNotificationSettingEntity)
    private readonly notifRepo: Repository<FormNotificationSettingEntity>,
    @InjectRepository(FormBadgeStateEntity)
    private readonly badgeRepo: Repository<FormBadgeStateEntity>,
    private readonly ds: DataSource,
    private readonly comms: CommunicationsService,
  ) { }

  // =========================================================
  //  // =========================================================
  // utils
  // =========================================================
  async findCompanyIdByUser(userId: string): Promise<string | null> {
    if (!userId) return null;
    const rows = await this.ds.query(
      `SELECT "companyId" FROM "user_entity" WHERE "id" = $1 LIMIT 1`,
      [userId],
    );
    return rows?.[0]?.companyId ?? null;
  }

  async findFormById(formId: string): Promise<FormEntity | null> {
    return this.formRepo.findOne({ where: { id: formId } });
  }

  private async hasTable(table: string): Promise<boolean> {
    const row = await this.ds.query(`SELECT to_regclass($1) AS t`, [table]);
    return !!row?.[0]?.t;
  }

  // =========================================================
  // segmentos
  // =========================================================
  async segments(companyId: string) {
    const tSpace = (await this.hasTable('public.space'))
      ? 'public.space'
      : (await this.hasTable('public.spaces'))
        ? 'public.spaces'
        : null;

    const tGroup = (await this.hasTable('public."group"'))
      ? 'public."group"'
      : (await this.hasTable('public.groups'))
        ? 'public.groups'
        : null;

    const spaces = tSpace
      ? await this.ds.query(
        `SELECT id, name FROM ${tSpace} WHERE "companyId"=$1 AND COALESCE(active,true)=true ORDER BY name ASC`,
        [companyId],
      )
      : [];

    const groups = tGroup
      ? await this.ds.query(
        `SELECT id, name FROM ${tGroup} WHERE "companyId"=$1 ORDER BY name ASC`,
        [companyId],
      )
      : [];

    return { spaces, groups };
  }

  // =========================================================
  // listar forms
  // =========================================================
  async listForms(companyId: string, status?: string) {
    const params: any[] = [companyId];
    const statusWhere = status ? 'AND f.status = $2' : '';
    if (status) params.push(status);

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
    );

    return rows;
  }

  // =========================================================
  // criar form
  // =========================================================
  async createForm(
    companyId: string,
    createdBy: string,
    dto: CreateFormDto,
  ) {
    if (companyId !== dto.companyId) {
      throw new ForbiddenException('companyId mismatch');
    }

    // normaliza anexos (frontend manda attachmentsAllowed e allowAttachments)
    const attachmentsFlag =
      dto.attachmentsAllowed === true ||
      (dto as any).allowAttachments === true;

    const form = this.formRepo.create({
      ...dto,
      createdBy,
      scheduleStartAt: dto.scheduleStartAt
        ? new Date(dto.scheduleStartAt)
        : null,
      scheduleEndAt: dto.scheduleEndAt ? new Date(dto.scheduleEndAt) : null,
      deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
      publishedAt: dto.status === 'published' ? new Date() : null,
      version: 1,
      attachmentsAllowed: attachmentsFlag,
      attachmentHelpText: dto.attachmentHelpText ?? null,
    });
    await this.formRepo.save(form);

    let order = 0;
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
      });
      await this.fieldRepo.save(field);
    }

    return this.getForm(companyId, form.id);
  }

  // =========================================================
  // atualizar form
  // =========================================================
  async updateForm(
    companyId: string,
    formId: string,
    dto: UpdateFormDto,
  ) {
    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });
    if (!form) {
      throw new NotFoundException('form not found');
    }

    // atualiza dados básicos
    form.title = dto.title ?? form.title;
    form.description = dto.description ?? form.description;
    form.status = dto.status ?? form.status;
    form.scheduleStartAt = dto.scheduleStartAt
      ? new Date(dto.scheduleStartAt)
      : form.scheduleStartAt;
    form.scheduleEndAt = dto.scheduleEndAt
      ? new Date(dto.scheduleEndAt)
      : form.scheduleEndAt;
    form.deadlineAt = dto.deadlineAt
      ? new Date(dto.deadlineAt)
      : form.deadlineAt;
    form.allowMultipleSubmissions =
      dto.allowMultipleSubmissions ?? form.allowMultipleSubmissions;
    form.anonymous = dto.anonymous ?? form.anonymous;
    form.allowExternal = dto.allowExternal ?? form.allowExternal;
    form.audienceSpaceIds = dto.audienceSpaceIds ?? form.audienceSpaceIds;
    form.audienceGroupIds = dto.audienceGroupIds ?? form.audienceGroupIds;
    form.remindersConfig = dto.remindersConfig ?? form.remindersConfig;
    form.notificationsConfig =
      dto.notificationsConfig ?? form.notificationsConfig;
    form.requiresApproval = dto.requiresApproval ?? form.requiresApproval;
    form.allowTranslations = dto.allowTranslations ?? form.allowTranslations;
    form.defaultLocale = dto.defaultLocale ?? form.defaultLocale;

    // 👇 AQUI estava faltando
    // normaliza o nome que o frontend manda
    const attachmentsFlag =
      dto.attachmentsAllowed ??
      (dto as any).allowAttachments ??
      form.attachmentsAllowed;
    form.attachmentsAllowed = !!attachmentsFlag;
    form.attachmentHelpText =
      dto.attachmentHelpText !== undefined
        ? dto.attachmentHelpText
        : form.attachmentHelpText;

    // se publicar agora
    if (dto.status === 'published' && !form.publishedAt) {
      form.publishedAt = new Date();
    }

    await this.formRepo.save(form);

    // se vieram campos no DTO, vamos substituir os campos da versão atual
    if (Array.isArray(dto.fields)) {
      await this.fieldRepo.delete({
        companyId,
        formId,
        version: form.version || 1,
      });

      let order = 0;
      for (const f of dto.fields) {
        const field = this.fieldRepo.create({
          companyId,
          formId,
          version: form.version || 1,
          type: f.type,
          label: f.label,
          required: !!f.required,
          options: f.options || null,
          order: f.order ?? order++,
        });
        await this.fieldRepo.save(field);
      }
    }

    return this.getForm(companyId, formId);
  }

  // =========================================================
  // get form
  // =========================================================
  async getForm(companyId: string, formId: string) {
    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });
    if (!form) throw new NotFoundException('form not found');

    const fields = await this.fieldRepo.find({
      where: {
        companyId,
        formId,
        version: form.version || 1,
      },
      order: { order: 'ASC' as any },
    });

    return {
      ...form,
      fields,
      audienceAllCompany:
        (form.audienceSpaceIds?.length ?? 0) === 0 &&
        (form.audienceGroupIds?.length ?? 0) === 0,
    };
  }

  // =========================================================
  // submit (interno) - COM TRANSAÇÃO
  // =========================================================
  async submit(
    companyId: string,
    formId: string,
    userId: string | null,
    dto: CreateSubmissionDto,
  ) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }

    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });
    if (!form) throw new NotFoundException('form not found');

    const {
      submission,
      submissionId,
      submittedAt,
      isOnTime,
    } = await this.ds.transaction(async manager => {
      const submittedAt = new Date();
      const isOnTime = form.deadlineAt
        ? submittedAt.getTime() <= new Date(form.deadlineAt).getTime()
        : null;

      const storedUserId = dto.external || form.anonymous ? null : userId;

      if (!dto.external && !form.anonymous && !storedUserId) {
        throw new BadRequestException(
          'userId is required for internal submissions',
        );
      }

      const subRepo = manager.getRepository(FormSubmissionEntity);
      const ansRepo = manager.getRepository(FormAnswerEntity);
      const attRepo = manager.getRepository(FormAttachmentEntity);

      const sub = subRepo.create({
        companyId,
        formId,
        submittedAt,
        userId: storedUserId,
        external: !!dto.external,
        externalEmail: dto.externalEmail || null,
        spaceIds: dto.spaceIds || [],
        groupIds: dto.groupIds || [],
        isOnTime,
        status: form.requiresApproval ? 'pending' : 'replied',
        replyCount: 0,
        fileCount: dto.attachments?.length || 0,
        meta: dto.meta || null,
      });
      await subRepo.save(sub);

      for (const a of dto.answers || []) {
        await ansRepo.save(
          ansRepo.create({
            companyId,
            submissionId: sub.id,
            formId,
            fieldId: a.fieldId,
            type: a.type,
            value: a.value,
          }),
        );
      }

      for (const at of dto.attachments || []) {
        await attRepo.save(
          attRepo.create({
            companyId,
            submissionId: sub.id,
            formId,
            storagePath: at.storagePath,
            mimeType: at.mimeType,
            bytes: at.bytes ? String(at.bytes) : null,
            uploadedAt: new Date(),
            status: 'ok',
            error: null,
          }),
        );
      }

      return {
        submissionId: sub.id,
        submittedAt,
        isOnTime,
        submission: sub,
      };
    });

    const response = {
      ok: true,
      submissionId,
      submittedAt,
      isOnTime,
    };

    this.postSubmitSideEffects(companyId, form, submission, dto.spaceIds || [])
      .catch(err => {
        this.log.warn(`forms: postSubmitSideEffects error: ${String(err)}`);
      });

    return response;
  }

  // =========================================================
  // submit público (se for usar direto no service)
  // =========================================================
  async submitPublic(formId: string, dto: CreateSubmissionDto) {
    const form = await this.formRepo.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('form not found');
    if (!form.allowExternal) {
      throw new BadRequestException(
        'external submissions not allowed for this form',
      );
    }
    return this.submit(form.companyId, formId, null, {
      ...dto,
      external: true,
    });
  }

  // =========================================================
  // pós-processamento (badge + e-mail)
  // =========================================================
  private async postSubmitSideEffects(
    companyId: string,
    form: FormEntity,
    sub: FormSubmissionEntity,
    submissionSpaces: string[],
  ) {
    try {
      await this.ds.query(
        `UPDATE form_badge_state
            SET "newCount" = COALESCE("newCount",0) + 1
          WHERE "companyId" = $1 AND "formId" = $2`,
        [companyId, form.id],
      );
    } catch (e) {
      this.log.warn(`forms: não consegui incrementar badge azul: ${String(e)}`);
    }

    try {
      await this.notifySubmission(companyId, form, sub, submissionSpaces);
    } catch (e) {
      this.log.warn(`forms: erro ao enviar e-mail de submissão: ${String(e)}`);
      try {
        await this.ds.query(
          `UPDATE form_badge_state
              SET "errorCount" = COALESCE("errorCount",0) + 1
            WHERE "companyId" = $1 AND "formId" = $2`,
          [companyId, form.id],
        );
      } catch (ee) {
        this.log.warn(
          `forms: não consegui incrementar badge vermelho: ${String(ee)}`,
        );
      }
    }
  }

  // =========================================================
  // sanitize de e-mails
  // =========================================================
  private sanitizeEmailList(raw: any): string[] {
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? [raw]
        : [];

    const cleaned: string[] = [];
    for (const item of arr) {
      if (!item) continue;
      const e = String(item)
        .trim()
        .replace(/[}>]+$/g, '')
        .replace(/^<|>$/g, '');
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
        cleaned.push(e);
      } else {
        this.log.warn(`forms: email inválido ignorado: "${item}" -> "${e}"`);
      }
    }
    return cleaned;
  }

  // =========================================================
  // enviar e-mail de submissão
  // =========================================================
  private async notifySubmission(
    companyId: string,
    form: FormEntity,
    sub: FormSubmissionEntity,
    submissionSpaces: string[],
  ) {
    const settings = await this.notifRepo.find({
      where: { companyId, formId: form.id },
      order: { spaceId: 'ASC' as any },
    });

    if (!settings.length) return;

    const targetSpaces =
      (form.audienceSpaceIds && form.audienceSpaceIds.length
        ? form.audienceSpaceIds
        : submissionSpaces) || [];

    const emails = new Set<string>();

    for (const s of settings) {
      const list = this.sanitizeEmailList(s.emails);
      if (!s.spaceId) {
        list.forEach(e => emails.add(e));
      } else if (targetSpaces.includes(s.spaceId)) {
        list.forEach(e => emails.add(e));
      }
    }

    if (!emails.size) return;

    await this.comms.sendEmail({
      companyId,
      to: Array.from(emails),
      subject: `Novo formulário enviado: ${form.title}`,
      template: 'forms/new-submission',
      data: {
        formId: form.id,
        submissionId: sub.id,
        submittedAt: sub.submittedAt.toISOString(),
      },
    });
  }

  // =========================================================
  // list submissions
  // =========================================================
  async listSubmissions(
    companyId: string,
    formId: string,
    userId: string | null,
    page = 1,
    pageSize = 50,
  ) {
    const qb = this.subRepo
      .createQueryBuilder('s')
      .where('s.companyId = :companyId', { companyId });

    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = (s?: string) => !!s && uuidV4Regex.test(s);

    if (formId === 'my' || formId === 'mine' || !isUuid(formId)) {
      if (!userId) {
        throw new BadRequestException(
          'listSubmissions(my): userId is required',
        );
      }
      qb.andWhere('s.userId = :userId', { userId });
    } else {
      qb.andWhere('s.formId = :formId', { formId });
    }

    qb
      .orderBy('s.submittedAt', 'DESC')
      .addOrderBy('s.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  // =========================================================
  // list minhas submissões
  // =========================================================
  async listMySubmissions(
    userId: string,
    companyId: string,
    page = 1,
    pageSize = 50,
  ) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const offset = (page - 1) * pageSize;

    const rows = await this.ds.query(
      `
      SELECT
        s.id                 AS "submissionId",
        s."formId"           AS "formId",
        f.title              AS "formTitle",
        s."submittedAt"      AS "submittedAt",
        s.status             AS "status",
        (s."replyCount" > 0) AS "hasReply"
      FROM form_submission s
      LEFT JOIN form f
        ON f.id = s."formId"
       AND f."companyId" = s."companyId"
      WHERE s."companyId" = $1
        AND s."userId"    = $2
      ORDER BY s."submittedAt" DESC, s."createdAt" DESC
      LIMIT $3 OFFSET $4
      `,
      [companyId, userId, pageSize, offset],
    );

    const totalRow = await this.ds.query(
      `
      SELECT COUNT(*)::int AS cnt
        FROM form_submission s
       WHERE s."companyId" = $1
         AND s."userId"    = $2
      `,
      [companyId, userId],
    );
    const total = totalRow?.[0]?.cnt ?? rows.length;

    return {
      total,
      page,
      pageSize,
      items: rows,
    };
  }


  // =========================================================
  // notif settings (GET)
  // =========================================================
  async getFormNotificationSettings(companyId: string, formId: string) {
    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });
    if (!form) throw new NotFoundException('form not found');

    const rows = await this.notifRepo.find({
      where: { companyId, formId },
      order: { spaceId: 'ASC' as any },
    });

    return {
      items: rows.map(r => ({
        spaceId: r.spaceId,
        emails: Array.isArray(r.emails) ? r.emails : [],
      })),
    };
  }

  // =========================================================
  // notif settings (POST) — versão que não estoura índice
  // =========================================================
  async saveFormNotificationSettings(
    companyId: string,
    formId: string,
    items: Array<{ spaceId: string | null; emails: string[] }>,
  ) {
    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });
    if (!form) throw new NotFoundException('form not found');

    // log do que chegou
    console.log(
      '[forms.service][saveFormNotificationSettings] companyId=',
      companyId,
      'formId=',
      formId,
      'items=',
      JSON.stringify(items, null, 2),
    );

    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      for (const it of items) {
        const spaceId = it.spaceId ?? null;
        const emails = Array.isArray(it.emails) ? it.emails : [];

        // se veio vazio, apaga só desse form + space
        if (!emails.length) {
          await qr.manager
            .createQueryBuilder()
            .delete()
            .from('form_notification_setting')
            .where('"companyId" = :companyId', { companyId })
            .andWhere('"formId" = :formId', { formId })
            .andWhere('"spaceId" IS NOT DISTINCT FROM :spaceId', { spaceId })
            .execute();
          continue;
        }

        // upsert em cima do índice (companyId, spaceId)
        await qr.manager
          .createQueryBuilder()
          .insert()
          .into('form_notification_setting')
          .values({
            companyId,
            formId,
            spaceId,
            emails,
          })
          .orUpdate(
            ['emails', 'updatedAt', 'formId'],
            ['companyId', 'spaceId'],
          )
          .execute();
      }

      await qr.commitTransaction();
      console.log('[forms.service][saveFormNotificationSettings] OK');
    } catch (e) {
      await qr.rollbackTransaction();
      console.error(
        '[forms.service][saveFormNotificationSettings] ERROR:',
        e,
      );
      throw e;
    } finally {
      await qr.release();
    }

    return { ok: true };
  }

  // =========================================================
  // detalhe da submissão
  // =========================================================
  async getSubmissionDetail(
    companyId: string,
    formId: string,
    submissionId: string,
  ) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId, formId, companyId },
    });
    if (!sub) throw new NotFoundException('submission not found');

    const form = await this.formRepo.findOne({
      where: { id: formId, companyId },
    });

    const answers = await this.ansRepo.find({
      where: { companyId, submissionId },
      order: { fieldId: 'ASC' as any },
    });

    const attachments = await this.attRepo.find({
      where: { companyId, submissionId },
      order: { uploadedAt: 'ASC' as any },
    });

    const rhActions = await this.rhRepo.find({
      where: { companyId, formId, submissionId },
      order: { createdAt: 'ASC' as any },
    });

    return {
      submissionId: sub.id,
      formId: sub.formId,
      formTitle: form?.title ?? null,
      submittedAt: sub.submittedAt,
      status: sub.status,
      isOnTime: sub.isOnTime,
      external: sub.external,
      externalEmail: sub.externalEmail,
      answers,
      attachments,
      rhActions,
      meta: sub.meta,
    };
  }

  // =========================================================
  // responder
  // =========================================================
  async respond(
    companyId: string,
    formId: string,
    submissionId: string,
    actorUserId: string,
    dto: RespondDto,
  ) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId, formId, companyId },
    });
    if (!sub) throw new NotFoundException('submission not found');

    await this.rhRepo.save(
      this.rhRepo.create({
        companyId,
        formId,
        submissionId,
        actorUserId,
        type: dto.type,
        message: dto.message || null,
      }),
    );

    let newStatus = sub.status;
    if (dto.type === 'approve') newStatus = 'approved';
    else if (dto.type === 'reject') newStatus = 'rejected';
    else if (dto.type === 'reply') newStatus = 'replied';

    await this.subRepo.update(
      { id: submissionId },
      {
        status: newStatus,
        replyCount: () => `"replyCount" + 1`,
      } as any,
    );

    if (sub.userId && !sub.external) {
      try {
        await this.comms.sendPush({
          companyId,
          userIds: [sub.userId],
          title: `Formulário ${formId} respondido!`,
          body: 'Toque para ver',
          deepLinkMobile: `iuppy://forms/${formId}/submissions/${submissionId}`,
          kind: 'FORM_REPLY',
          data: { formId, submissionId },
        });
      } catch (e) {
        this.log.warn(`push error: ${String(e)}`);
      }
    }

    return { ok: true };
  }
}