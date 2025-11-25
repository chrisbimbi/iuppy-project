// src/modules/forms/forms.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import {
  FormEntity,
  TranslatableString,
  FormStatus,
} from './entities/form.entity';
import { FormFieldEntity } from './entities/form-field.entity';
import { FormSubmissionEntity } from './entities/form-submission.entity';
import { FormAnswerEntity } from './entities/form-answer.entity';
import { FormAttachmentEntity } from './entities/form-attachment.entity';
import { FormRhActionEntity } from './entities/form-rh-action.entity';
import { FormNotificationSettingEntity } from './entities/form-notification-setting.entity';
import { FormBadgeStateEntity } from './entities/form-badge-state.entity';
import {
  FormSubmissionChatEntity,
  FormChatActor,
} from './entities/form-submission-chat.entity';
import {
  FormAuditLogEntity,
  FormAuditAction,
} from './entities/form_audit_log.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { RespondDto } from './dto/respond.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
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
    @InjectRepository(FormSubmissionChatEntity)
    private readonly chatRepo: Repository<FormSubmissionChatEntity>,
    @InjectRepository(FormAuditLogEntity)
    private readonly auditRepo: Repository<FormAuditLogEntity>,
    private readonly ds: DataSource,
    private readonly comms: CommunicationsService,
  ) { }

  // =========================================================
  // UTILS
  // =========================================================

  private async logAudit(
    companyId: string,
    actorUserId: string,
    action: FormAuditAction,
    formId?: string | null,
    submissionId?: string | null,
    changes?: any | null,
  ) {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          companyId,
          actorUserId,
          action,
          formId: formId || null,
          submissionId: submissionId || null,
          changes: changes || null,
        }),
      );
    } catch (e) {
      this.log.warn(`[AuditLog] Falha ao registrar ação "${action}": ${String(e)}`);
    }
  }

  async findCompanyIdByUser(userId: string): Promise<string | null> {
    if (!userId) return null;
    const rows = await this.ds.query(
      `SELECT "companyId" FROM "user_entity" WHERE "id" = $1 LIMIT 1`,
      [userId],
    );
    return rows?.[0]?.companyId ?? null;
  }

  private async getUserIdsForAudience(
    companyId: string,
    spaceIds: string[] | null,
    groupIds: string[] | null,
  ): Promise<string[]> {
    if ((!spaceIds || spaceIds.length === 0) && (!groupIds || groupIds.length === 0)) {
      const allUsers = await this.ds.query(
        `SELECT id FROM "user_entity" WHERE "companyId" = $1`,
        [companyId],
      );
      return allUsers.map((u: any) => u.id);
    }

    const allUserIds = new Set<string>();

    if (spaceIds?.length) {
      try {
        const spaceUsers = await this.ds.query(
          `SELECT "userId" FROM "user_space_entity" WHERE "companyId" = $1 AND "spaceId" = ANY($2::uuid[])`,
          [companyId, spaceIds],
        );
        spaceUsers.forEach((r: any) => allUserIds.add(r.userId));
      } catch (e) { }
    }

    if (groupIds?.length) {
      try {
        const groupUsers = await this.ds.query(
          `SELECT "userId" FROM "user_group_entity" WHERE "companyId" = $1 AND "groupId" = ANY($2::uuid[])`,
          [companyId, groupIds],
        );
        groupUsers.forEach((r: any) => allUserIds.add(r.userId));
      } catch (e) { }
    }

    return Array.from(allUserIds);
  }

  private async getUserGroupsAndSpaces(userId: string) {
    let groupIds: string[] = [];
    let spaceIds: string[] = [];

    try {
      const groups = await this.ds.query(
        `SELECT group_id FROM user_group_members WHERE user_id = $1::uuid`,
        [userId]
      );
      groupIds = groups.map((g: any) => g.group_id);

      const spaces = await this.ds.query(
        `SELECT id FROM space WHERE "companyId" = (SELECT "companyId" FROM user_entity WHERE id = $1::uuid) AND COALESCE(active,true)=true`,
        [userId]
      );
      spaceIds = spaces.map((s: any) => s.id);
    } catch (e) {
      this.log.warn(`Erro ao recuperar grupos/spaces do usuário ${userId}: ${e}`);
    }

    return { groupIds, spaceIds };
  }

  private async sendPublicationPush(form: FormEntity, actorUserId: string) {
    const config = form.notificationsConfig as any;
    const pushData = config?.pushPayload || config?.pushOnPublish;

    if (!config?.push) return;
    if (!pushData) return;

    const getStr = (val: any): string => {
      if (typeof val === 'string') return val;
      const loc = form.defaultLocale || 'pt-BR';
      return val?.[loc] || val?.['pt-BR'] || Object.values(val || {})[0] || '';
    };

    const title = getStr(pushData.title);
    const body = getStr(pushData.body);

    if (!title || !body) return;

    try {
      const userIds = await this.getUserIdsForAudience(
        form.companyId,
        form.audienceSpaceIds,
        form.audienceGroupIds,
      );

      if (userIds.length === 0) return;

      await this.comms.sendPush({
        companyId: form.companyId,
        userIds: userIds,
        title: title,
        body: body,
        deepLinkMobile: `iuppy://forms/${form.id}`,
        kind: 'FORM_PUBLISHED',
        entityId: form.id,
      });

      await this.logAudit(form.companyId, actorUserId, 'form_push_sent', form.id, null, { count: userIds.length });
    } catch (e) {
      this.log.error(`[PushOnPublish] Falha: ${String(e)}`);
    }
  }

  async getMyInteractions(userId: string, companyId: string, limit = 50) {
    const sql = `
      SELECT * FROM (
        SELECT 
          c.id::text AS "id", 
          c."createdAt" AS "date", 
          'chat' AS "type", 
          c.message AS "message",
          s.id::text AS "submissionId", 
          s."formId"::text AS "formId",
          f.title AS "formTitle", 
          f."defaultLocale" AS "defaultLocale", 
          s."userUnreadChatCount" AS "unreadCount"
        FROM form_submission_chat c
        JOIN form_submission s ON s.id = c."submissionId"
        JOIN form f ON f.id = s."formId"
        WHERE s."userId" = $1 
          AND s."companyId" = $2
          AND c.actor = 'rh'

        UNION ALL

        SELECT 
          a.id::text AS "id", 
          a."createdAt" AS "date", 
          a.type AS "type",
          a.message AS "message",
          s.id::text AS "submissionId", 
          s."formId"::text AS "formId",
          f.title AS "formTitle", 
          f."defaultLocale" AS "defaultLocale", 
          s."userUnreadChatCount" AS "unreadCount"
        FROM form_rh_action a
        JOIN form_submission s ON s.id = a."submissionId"
        JOIN form f ON f.id = s."formId"
        WHERE s."userId" = $1 
          AND s."companyId" = $2
          AND a.type IN ('approve', 'reject')

      ) t
      ORDER BY "date" DESC
      LIMIT $3
    `;

    return this.ds.query(sql, [userId, companyId, limit]);
  }

  // =========================================================
  // CRUD & READ
  // =========================================================

  async findFormById(formId: string): Promise<FormEntity | null> {
    return this.formRepo.findOne({ where: { id: formId } });
  }

  async getForm(companyId: string, formId: string) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } });
    if (!form) throw new NotFoundException('form not found');
    const fields = await this.fieldRepo.find({ where: { companyId, formId, version: form.version || 1 }, order: { order: 'ASC' as any } });
    return { ...form, fields, audienceAllCompany: (form.audienceSpaceIds?.length ?? 0) === 0 && (form.audienceGroupIds?.length ?? 0) === 0 };
  }

  async listForms(companyId: string, status?: string) {
    const params: any[] = [companyId];
    const statusWhere = status ? 'AND f.status = $2' : '';
    if (status) params.push(status);

    const sql = `
      SELECT 
        f.id, 
        f.status, 
        f."createdAt", 
        f.version, 
        f."publishedAt", 
        f.title, 
        f.description,
        f."scheduleStartAt",
        f."scheduleEndAt",
        f."deadlineAt",
        f."requiresApproval",
        f."attachmentsAllowed",
        f."audienceSpaceIds",
        f."audienceGroupIds",
        (SELECT COUNT(*) FROM form_field ff WHERE ff."companyId"=f."companyId" AND ff."formId"=f.id AND ff."version"=f.version)::int AS "questionsCount", 
        (SELECT COUNT(*) FROM form_submission s WHERE s."companyId"=f."companyId" AND s."formId"=f.id)::int AS "submissionsCount" 
      FROM form f 
      WHERE f."companyId"=$1 ${statusWhere} 
      ORDER BY f."createdAt" DESC
    `;
    return this.ds.query(sql, params);
  }

  async segments(companyId: string) {
    const spaces = await this.ds.query(`SELECT id, name FROM space WHERE "companyId"=$1 AND COALESCE(active,true)=true ORDER BY name ASC`, [companyId]).catch(() => []);
    const groups = await this.ds.query(`SELECT id, name FROM user_group WHERE "companyId"=$1 ORDER BY name ASC`, [companyId]).catch(() => []);
    return { spaces, groups };
  }

  // =========================================================
  // SUBMIT
  // =========================================================
  async submit(companyId: string, formId: string, userId: string | null, dto: CreateSubmissionDto) {
    if (!companyId) throw new BadRequestException('companyId is required');

    const form = await this.formRepo.findOne({ where: { id: formId, companyId } });
    if (!form) throw new NotFoundException('form not found');

    const { submission, submissionId, submittedAt, isOnTime } = await this.ds.transaction(async (manager) => {
      const submittedAt = new Date();
      const isOnTime = form.deadlineAt ? submittedAt.getTime() <= new Date(form.deadlineAt).getTime() : null;
      const storedUserId = dto.external || form.anonymous ? null : userId;

      if (!dto.external && !form.anonymous && !storedUserId) {
        throw new BadRequestException('userId is required for internal submissions');
      }

      let finalGroupIds = dto.groupIds || [];
      let finalSpaceIds = dto.spaceIds || [];

      if (storedUserId) {
        if (finalGroupIds.length === 0 || finalSpaceIds.length === 0) {
          const enriched = await this.getUserGroupsAndSpaces(storedUserId);
          if (finalGroupIds.length === 0) finalGroupIds = enriched.groupIds;
          if (finalSpaceIds.length === 0) finalSpaceIds = enriched.spaceIds;
        }
      }

      const subRepo = manager.getRepository(FormSubmissionEntity);
      const ansRepo = manager.getRepository(FormAnswerEntity);
      const attRepo = manager.getRepository(FormAttachmentEntity);

      const initialStatus = form.requiresApproval ? 'pending' : 'submitted';

      const sub = subRepo.create({
        companyId,
        formId,
        formVersion: form.version,
        submittedAt,
        userId: storedUserId,
        external: !!dto.external,
        externalEmail: dto.externalEmail || null,
        spaceIds: finalSpaceIds,
        groupIds: finalGroupIds,
        isOnTime,
        status: initialStatus,
        replyCount: 0,
        fileCount: dto.attachments?.length || 0,
        meta: dto.meta || null,
        chatStatus: 'open',
        userUnreadChatCount: 0,
      });
      await subRepo.save(sub);

      for (const a of dto.answers || []) {
        await ansRepo.save(ansRepo.create({ companyId, submissionId: sub.id, formId, fieldId: a.fieldId, type: a.type, value: a.value }));
      }

      for (const at of dto.attachments || []) {
        await attRepo.save(attRepo.create({ companyId, submissionId: sub.id, formId, storagePath: at.storagePath, mimeType: at.mimeType, bytes: at.bytes ? String(at.bytes) : null, uploadedAt: new Date(), status: 'ok', error: null }));
      }

      return { submissionId: sub.id, submittedAt, isOnTime, submission: sub };
    });

    this.postSubmitSideEffects(companyId, form, submission, dto.spaceIds || []).catch((err) => {
      this.log.warn(`postSubmitSideEffects error: ${String(err)}`);
    });

    return { ok: true, submissionId, submittedAt, isOnTime };
  }

  async submitPublic(formId: string, dto: CreateSubmissionDto) {
    const form = await this.formRepo.findOne({ where: { id: formId } });
    if (!form) throw new NotFoundException('form not found');
    if (!form.allowExternal) throw new BadRequestException('external submissions not allowed');
    return this.submit(form.companyId, formId, null, { ...dto, external: true });
  }

  private async postSubmitSideEffects(companyId: string, form: FormEntity, sub: FormSubmissionEntity, submissionSpaces: string[]) {
    try {
      await this.ds.query(`UPDATE form_badge_state SET "newCount" = COALESCE("newCount",0) + 1 WHERE "companyId" = $1 AND "formId" = $2`, [companyId, form.id]);
    } catch (e) { }
    try {
      await this.notifySubmission(companyId, form, sub, submissionSpaces);
    } catch (e) { }
  }

  private sanitizeEmailList(raw: any): string[] {
    const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
    return arr.map(i => String(i).trim()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  }

  private generateEnterpriseHtml(formTitle: string, submissionId: string, formId: string): string {
    const adminUrl = `https://admin.iuppy.com/forms/${formId}/submissions`;

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#F3F4F6;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding:40px 0;">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:32px;background:#1E1E2D;color:#ffffff;text-align:center;">
                  <h2 style="margin:0;font-size:24px;font-weight:600;">Nova Submissão Recebida</h2>
                  <p style="margin:8px 0 0;opacity:0.8;font-size:16px;">${formTitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;text-align:center;">
                  <p style="margin-bottom:24px;font-size:16px;color:#4B5563;line-height:1.5;">
                    Um colaborador acabou de enviar uma resposta para este formulário.
                    <br>Acesse o painel para revisar os detalhes e anexos.
                  </p>
                  <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;border:1px solid #E5E7EB;">
                     <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:bold;">ID da Submissão</p>
                     <p style="margin:4px 0 0;font-family:monospace;font-size:14px;color:#1F2937;">${submissionId}</p>
                  </div>
                  <a href="${adminUrl}" style="display:inline-block;background:#3E97FF;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px;">
                    Ver no Painel Administrativo
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;background:#F9FAFB;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;">
                  Enviado automaticamente pela iuppy Forms
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  private async notifySubmission(companyId: string, form: FormEntity, sub: FormSubmissionEntity, submissionSpaces: string[]) {
    const settings = await this.notifRepo.find({ where: { companyId, formId: form.id }, order: { spaceId: 'ASC' as any } });
    const targetSpaces = (form.audienceSpaceIds && form.audienceSpaceIds.length ? form.audienceSpaceIds : submissionSpaces) || [];
    const emails = new Set<string>();

    if (!settings.length) return;

    for (const s of settings) {
      const list = this.sanitizeEmailList(s.emails);
      if (!s.spaceId || targetSpaces.includes(s.spaceId)) {
        list.forEach((e) => emails.add(e));
      }
    }

    if (!emails.size) return;

    const title = (form.title as TranslatableString)['pt-BR'] ?? 'Novo Formulário';
    const htmlContent = this.generateEnterpriseHtml(title, sub.id, form.id);

    await this.comms.sendEmail({
      companyId,
      to: Array.from(emails),
      subject: `Nova resposta: ${title}`,
      html: htmlContent,
      data: { formId: form.id, submissionId: sub.id },
    });
  }

  async listSubmissions(companyId: string, formId: string, userId: string | null, page = 1, pageSize = 50) {
    const qb = this.subRepo.createQueryBuilder('s').where('s.companyId = :companyId', { companyId });
    if (formId === 'my' || formId === 'mine') {
      if (!userId) throw new BadRequestException('userId required');
      qb.andWhere('s.userId = :userId', { userId });
    } else {
      qb.andWhere('s.formId = :formId', { formId });
    }
    qb.orderBy('s.submittedAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [items, total] = await qb.getManyAndCount();
    return { total, page, pageSize, items };
  }

  async listMySubmissions(
    userId: string,
    companyId: string,
    page = 1,
    pageSize = 50,
    locale: string = 'pt-BR',
  ) {
    if (!companyId) throw new BadRequestException('companyId is required');
    if (!userId) throw new BadRequestException('userId is required');

    const offset = (page - 1) * pageSize;
    const titleField = `f.title->>'${locale.replace(/'/g, "''")}'`;
    const defaultTitleField = `f.title->>COALESCE(f."defaultLocale", 'pt-BR')`;

    const sql = `
      SELECT
        s.id AS "submissionId",
        s."formId" AS "formId",
        COALESCE(${titleField}, ${defaultTitleField}) AS "formTitle",
        s."submittedAt" AS "submittedAt",
        s.status AS "status",
        s."chatStatus" AS "chatStatus",
        s."userUnreadChatCount" AS "unreadChatCount",
        (s."replyCount" > 0) AS "hasReply"
      FROM form_submission s
      LEFT JOIN form f
        ON f.id = s."formId"
        AND f."companyId" = s."companyId"
      WHERE s."companyId" = $1
        AND s."userId" = $2
      ORDER BY s."submittedAt" DESC, s."createdAt" DESC
      LIMIT $3 OFFSET $4
    `;

    const rows = await this.ds.query(sql, [companyId, userId, pageSize, offset]);
    const totalRow = await this.ds.query(
      `SELECT COUNT(*)::int AS cnt FROM form_submission s WHERE s."companyId" = $1 AND s."userId" = $2`,
      [companyId, userId],
    );
    const total = totalRow?.[0]?.cnt ?? rows.length;

    return { total, page, pageSize, items: rows };
  }

  async createForm(companyId: string, createdBy: string, dto: CreateFormDto) {
    if (companyId !== dto.companyId) throw new ForbiddenException('companyId mismatch');
    const form = this.formRepo.create({ ...dto, createdBy, version: 1, publishedAt: dto.status === 'published' ? new Date() : null, defaultLocale: dto.defaultLocale ?? 'pt-BR' });
    await this.formRepo.save(form);
    let order = 0;
    for (const f of dto.fields || []) {
      await this.fieldRepo.save(this.fieldRepo.create({ companyId, formId: form.id, version: 1, type: f.type, label: f.label, required: !!f.required, options: f.options, order: f.order ?? order++ }));
    }
    await this.logAudit(companyId, createdBy, 'form_created', form.id);

    if (form.status === 'published') {
      const config = form.notificationsConfig as any;
      if (config?.push && (config?.pushPayload?.title || config?.pushOnPublish?.title)) {
        await this.sendPublicationPush(form, createdBy);
      }
    }
    return this.getForm(companyId, form.id);
  }

  async updateForm(companyId: string, formId: string, actorUserId: string, dto: UpdateFormDto) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } });
    if (!form) throw new NotFoundException('form not found');
    const oldStatus = form.status;
    const oldConfig = form.notificationsConfig as any;

    Object.assign(form, dto);
    if (dto.status === 'published' && !form.publishedAt) form.publishedAt = new Date();
    await this.formRepo.save(form);
    if (Array.isArray(dto.fields)) {
      await this.fieldRepo.delete({ companyId, formId, version: form.version || 1 });
      let order = 0;
      for (const f of dto.fields) await this.fieldRepo.save(this.fieldRepo.create({ companyId, formId, version: form.version || 1, type: f.type, label: f.label, required: !!f.required, options: f.options, order: f.order ?? order++ }));
    }
    await this.logAudit(companyId, actorUserId, 'form_updated', formId);

    const newConfig = form.notificationsConfig as any;

    const justPublished = form.status === 'published' && oldStatus !== 'published';
    const pushActivatedNow = form.status === 'published' && (!oldConfig?.push && newConfig?.push);

    if (justPublished || pushActivatedNow) {
      await this.sendPublicationPush(form, actorUserId);
    }
    return this.getForm(companyId, formId);
  }

  async updateStatus(companyId: string, formId: string, actorUserId: string, status: FormStatus) {
    const form = await this.formRepo.findOne({ where: { id: formId, companyId } });
    if (!form) throw new NotFoundException('form not found');
    const oldStatus = form.status;
    form.status = status;
    if (oldStatus === 'draft' && status === 'published') form.publishedAt = new Date();

    await this.formRepo.save(form);
    await this.logAudit(companyId, actorUserId, 'form_status_changed', formId, null, { from: oldStatus, to: status });

    if (status === 'published' && oldStatus !== 'published') {
      await this.sendPublicationPush(form, actorUserId);
    }
    return { ok: true, status };
  }

  async duplicate(companyId: string, formId: string, actorUserId: string) {
    const original = await this.getForm(companyId, formId);
    if (!original) throw new NotFoundException('form not found');
    const newFormId = await this.ds.transaction(async (manager) => {
      const newForm = manager.getRepository(FormEntity).create({ ...original, id: undefined, status: 'draft', publishedAt: null, version: 1, createdBy: actorUserId, title: { 'pt-BR': (original.title as any)['pt-BR'] + ' (Cópia)' } });
      await manager.getRepository(FormEntity).save(newForm);
      for (const f of original.fields) await manager.getRepository(FormFieldEntity).save(manager.getRepository(FormFieldEntity).create({ ...f, id: undefined, formId: newForm.id }));
      return newForm.id;
    });
    await this.logAudit(companyId, actorUserId, 'form_duplicated', newFormId, null, { fromFormId: formId });
    return this.getForm(companyId, newFormId);
  }

  async removeMany(companyId: string, actorUserId: string, ids: string[]) {
    if (!ids.length) return { ok: true, count: 0 };
    await this.formRepo.delete({ companyId, id: In(ids) });
    for (const id of ids) await this.logAudit(companyId, actorUserId, 'form_deleted', id);
    return { ok: true, count: ids.length };
  }

  async getSubmissionDetail(companyId: string, formId: string, submissionId: string, locale: string = 'pt-BR') {
    const sub = await this.subRepo.findOne({ where: { id: submissionId, formId, companyId } });
    if (!sub) throw new NotFoundException('submission not found');
    const answers = await this.ds.query(`SELECT a."fieldId", a.type, a.value, a."createdAt", f.label->>'pt-BR' as label, f.options FROM form_answer a LEFT JOIN form_field f ON f.id=a."fieldId" WHERE a."submissionId"=$1`, [submissionId]);
    const attachments = await this.attRepo.find({ where: { submissionId } });
    return { ...sub, answers, attachments };
  }

  // 🔥 ATUALIZADO: Mesma query UNION do getMyInteractions para consistência
  async getChatHistory(companyId: string, formId: string, submissionId: string, actorUserId: string, actor: FormChatActor) {
    const sub = await this.subRepo.findOne({ where: { id: submissionId } });
    if (actor === 'user' && sub?.userId === actorUserId) await this.subRepo.update({ id: submissionId }, { userUnreadChatCount: 0 });

    const sql = `
       SELECT * FROM (
         SELECT id::text, "createdAt", actor::text, message, 'chat' as type
         FROM form_submission_chat
         WHERE "submissionId" = $1

         UNION ALL

         SELECT id::text, "createdAt", 'rh' as actor, 
           (CASE WHEN type='approve' THEN '✅ APROVADO: ' || COALESCE(message, '')
                 WHEN type='reject' THEN '❌ REPROVADO: ' || COALESCE(message, '')
                 ELSE message END) as message,
           'action' as type
         FROM form_rh_action
         WHERE "submissionId" = $1
       ) t
       ORDER BY "createdAt" ASC
    `;

    const messages = await this.ds.query(sql, [submissionId]);

    return {
      chatStatus: sub?.chatStatus,
      messages: messages.map((m: any) => ({
        id: m.id,
        actor: m.actor,
        message: m.message,
        createdAt: m.createdAt
      }))
    };
  }

  async closeChat(companyId: string, formId: string, submissionId: string, actorUserId: string) {
    await this.subRepo.update({ id: submissionId }, { chatStatus: 'closed' });
    await this.chatRepo.save(this.chatRepo.create({ companyId, submissionId, actor: 'rh', userId: actorUserId, message: '(Encerrado pelo RH)' }));
    await this.logAudit(companyId, actorUserId, 'submission_chat_closed', formId, submissionId);
    return { ok: true };
  }

  async saveFormNotificationSettings(companyId: string, formId: string, actorUserId: string, items: any[]) {
    await this.notifRepo.delete({ companyId, formId });
    for (const it of items) await this.notifRepo.save(this.notifRepo.create({ companyId, formId, spaceId: it.spaceId, emails: it.emails }));
    await this.logAudit(companyId, actorUserId, 'notification_settings_updated', formId);
    return { ok: true };
  }

  async getFormNotificationSettings(companyId: string, formId: string) {
    const rows = await this.notifRepo.find({ where: { companyId, formId } });
    return { items: rows.map(r => ({ spaceId: r.spaceId, emails: r.emails })) };
  }

  async postChatMessage(companyId: string, formId: string, submissionId: string, actorUserId: string, dto: ChatMessageDto) {
    const sub = await this.subRepo.findOne({ where: { id: submissionId, formId, companyId } });
    if (!sub) throw new NotFoundException('Submissão não encontrada');
    if (dto.actor === 'user' && sub.chatStatus === 'closed') throw new ForbiddenException('Chat fechado');

    const message = this.chatRepo.create({ companyId, submissionId, actor: dto.actor, userId: actorUserId, message: dto.message });
    await this.chatRepo.save(message);

    await this.logAudit(companyId, actorUserId, 'submission_chat_sent', formId, submissionId, { actor: dto.actor });

    if (dto.actor === 'user') {
      await this.ds.query(
        `UPDATE form_badge_state SET "newCount" = COALESCE("newCount",0) + 1 WHERE "companyId" = $1 AND "formId" = $2`,
        [companyId, formId]
      );
    }

    if (dto.actor === 'rh') {
      const existingAction = await this.rhRepo.count({ where: { companyId, submissionId } });
      if (existingAction === 0) {
        await this.rhRepo.save(this.rhRepo.create({ companyId, formId, submissionId, actorUserId, type: 'reply', message: '(Via Chat)' }));
      }

      if (sub.status === 'submitted' || sub.status === 'pending') {
        await this.subRepo.update({ id: submissionId }, { status: 'replied' });
      }

      await this.subRepo.increment({ id: submissionId }, 'replyCount', 1);
    }

    if (dto.actor === 'rh' && sub.userId && !sub.external) {
      if (sub.chatStatus === 'closed') await this.subRepo.update({ id: submissionId }, { chatStatus: 'open' });
      // Badge App
      await this.subRepo.increment({ id: submissionId }, 'userUnreadChatCount', 1);

      const form = await this.formRepo.findOne({ where: { id: formId }, select: ['title', 'defaultLocale'] });
      const title = (form?.title as TranslatableString)?.['pt-BR'] ?? 'Formulário';
      try {
        await this.comms.sendPush({
          companyId, userIds: [sub.userId], title: `Nova mensagem: ${title}`, body: dto.message,
          deepLinkMobile: `iuppy://forms/${formId}/submissions/${submissionId}`, kind: 'FORM_CHAT', data: { formId, submissionId }
        });
      } catch (e) { }
    }
    return message;
  }

  async respond(companyId: string, formId: string, submissionId: string, actorUserId: string, dto: RespondDto) {
    const sub = await this.subRepo.findOne({ where: { id: submissionId, formId, companyId } });
    if (!sub) throw new NotFoundException('submission not found');

    await this.rhRepo.save(
      this.rhRepo.create({
        companyId,
        formId,
        submissionId,
        actorUserId,
        type: dto.type,
        message: dto.message,
      }),
    );

    const newStatus = dto.type === 'reply' ? 'replied' : dto.type === 'approve' ? 'approved' : 'rejected';

    // 🔥 CORREÇÃO: Incrementa userUnreadChatCount e replyCount
    await this.subRepo
      .createQueryBuilder()
      .update(FormSubmissionEntity)
      .set({
        status: newStatus,
        replyCount: () => '"replyCount" + 1',
        userUnreadChatCount: () => '"userUnreadChatCount" + 1'
      })
      .where("id = :id", { id: submissionId })
      .execute();

    await this.logAudit(companyId, actorUserId, `submission_${newStatus}` as any, formId, submissionId);

    // 🔥 CORREÇÃO: Push de resposta direciona para detalhes (?action=details)
    if (sub.userId && !sub.external) {
      const form = await this.formRepo.findOne({ where: { id: formId }, select: ['title'] });
      const title = (form?.title as any)?.['pt-BR'] ?? 'Formulário';
      const msgBody = dto.type === 'approve' ? 'Sua solicitação foi aprovada.' : dto.type === 'reject' ? 'Sua solicitação foi rejeitada.' : 'O RH respondeu sua solicitação.';

      try {
        await this.comms.sendPush({
          companyId,
          userIds: [sub.userId],
          title: `Atualização: ${title}`,
          body: msgBody,
          // Adicionado ?action=details
          deepLinkMobile: `iuppy://forms/${formId}/submissions/${submissionId}?action=details`,
          kind: 'FORM_RESPONSE',
          entityId: submissionId
        });
      } catch (e) { }
    }

    return { ok: true };
  }
}