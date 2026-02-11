// src/modules/forms/controllers/forms.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Delete,
  UsePipes, // S3+
  ValidationPipe, // S3+
} from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { RespondDto } from './dto/respond.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
// 🔥 S3+: Importa o novo DTO
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { FormsService } from './forms.service';
// 🔥 S3+: Importa o ACL Guard (se for usar)
// import { FormsAclGuard } from './guards/forms-acl.guard';
import { AccessControlService } from 'src/access-control/access-control.service';
import { Role } from '@shared/types';

@Controller('forms')
@UseGuards(JwtAccessGuard) // Protege todas as rotas por padrão
@UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // S3+: Adiciona validação
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly accessControlService: AccessControlService,
  ) { }

  private getCompanyIdSync(req: any): string | null {
    return (
      req?.user?.companyId ||
      req?.user?.company?.id ||
      req?.headers?.['x-company-id'] ||
      req?.query?.companyId ||
      null
    );
  }

  private getUserId(req: any): string | null {
    return req?.user?.id || req?.user?.sub || null;
  }

  // =========================================================
  // SEGMENTAÇÃO (CMS)
  // =========================================================
  @Get('segments')
  async segments(@Req() req: any, @Query('companyId') companyId?: string) {
    let cid = companyId || this.getCompanyIdSync(req);
    if (!cid) {
      const userId = this.getUserId(req);
      if (userId) {
        cid = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!cid) {
      throw new BadRequestException('companyId missing');
    }
    return this.formsService.segments(cid);
  }

  // =========================================================
  // LISTAR FORMS (CMS / APP)
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Get()
  async list(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('companyId') companyIdFromQuery?: string,
    @Query('template') template?: string,
    @Query('isNr1') isNr1?: boolean,
    @Query('visibility') visibility?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    // DEBUG LOG
    console.log(`[FormsController.list] Request: companyId=${companyId}, userId=${this.getUserId(req)}, isNr1=${isNr1}, role=${req.user?.role}`);

    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!companyId) { // Fallback check
      throw new BadRequestException('companyId missing');
    }

    const userId = this.getUserId(req);
    const role = req.user?.role;
    let allowedSpaceIds: string[] | undefined;
    let filterUserId: string | undefined;

    if (role === Role.User) {
      // App User: Apply Segmentation
      filterUserId = userId;
    } else {
      // Admin: Check ACL
      const caps = await this.accessControlService.capabilities(companyId, { id: userId, role });
      const formsCaps = caps.modules.forms;
      console.log(`[FormsController.list] Caps: canView=${formsCaps?.canView}`);

      if (!formsCaps?.canView) {
        console.warn(`[FormsController.list] ACCESS DENIED: User ${userId} cannot view forms in ${companyId}`);
        return [];
      }

      if (formsCaps.scopeType === 'SPACE_IDS') {
        allowedSpaceIds = formsCaps.spaceIds;
      }
    }

    // Convert string 'true'/'false' to boolean if needed, though NestJS pipes usually handle this if typed correctly 
    // but here we are using manual query parsing mostly
    const isNr1Bool = isNr1 === undefined || isNr1 === null ? undefined : String(isNr1) === 'true';

    return this.formsService.listForms(
      companyId,
      status,
      visibility,
      allowedSpaceIds,
      filterUserId,
      template,
      isNr1Bool
    );
  }

  // 🔥 NOVO ENDPOINT
  @Get('my/interactions')
  async myInteractions(@Req() req: any, @Query('limit') limit = '50') {
    let companyId = this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId || !userId) {
      throw new BadRequestException('companyId/userId missing');
    }

    return this.formsService.getMyInteractions(
      userId,
      companyId,
      Number(limit),
    );
  }
  // =========================================================
  // CRIAR FORM (CMS)
  // =========================================================
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateFormDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    if (!userId) {
      throw new BadRequestException('userId missing');
    }
    // Assinatura do Service: createForm(companyId, createdBy, dto)
    return this.formsService.createForm(companyId, userId, dto);
  }

  // =========================================================
  // ATUALIZAR FORM (CMS)
  // =========================================================
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req); // Pega o ator
    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    if (!userId) {
      throw new BadRequestException('userId missing for update');
    }

    // ==================================
    // CORREÇÃO (Fase 3): Passa o actorUserId
    // Assinatura do Service: updateForm(companyId, formId, actorUserId, dto)
    // ==================================
    return this.formsService.updateForm(companyId, id, userId, dto);
  }

  // =========================================================
  // DETALHE FORM (CMS / APP)
  // =========================================================
  @Get(':id')
  async detail(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    return this.formsService.getForm(companyId, id);
  }

  // =========================================================
  // AÇÕES DE GERENCIAMENTO (NOVAS - S1 FIX)
  // =========================================================
  @Post(':id/publish')
  async publish(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    const companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req); // Pega o ator
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');
    // Assinatura: updateStatus(companyId, formId, actorUserId, status)
    return this.formsService.updateStatus(companyId, id, userId, 'published');
  }

  @Post(':id/unpublish')
  async unpublish(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    const companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req); // Pega o ator
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');
    // Assinatura: updateStatus(companyId, formId, actorUserId, status)
    return this.formsService.updateStatus(companyId, id, userId, 'draft');
  }

  @Post(':id/duplicate')
  async duplicate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    const companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing for duplicate');
    // Assinatura: duplicate(companyId, formId, actorUserId)
    return this.formsService.duplicate(companyId, id, userId);
  }

  @Post('remove-many')
  async removeMany(
    @Req() req: any,
    @Body() body: { ids: string[] },
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    const companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');

    return this.formsService.removeMany(companyId, userId, body.ids || []);
  }

  // =========================================================
  // SUBMIT (APP LOGADO)
  // =========================================================
  @Post(':id/submit')
  async submitInternal(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateSubmissionDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    const userId = this.getUserId(req);
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.submit(companyId, id, userId, {
      ...dto,
      external: false,
    });
  }

  @Post(':id/submissions') // alias
  async submitInternalAlias(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateSubmissionDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    return this.submitInternal(req, id, dto, companyIdFromQuery);
  }

  // =========================================================
  // LISTAR SUBMISSÕES (CMS / APP)
  // =========================================================
  @Get(':id/submissions')
  async listSubmissions(
    @Req() req: any,
    @Param('id') id: string, // pode ser 'my'
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('companyId') companyIdFromQuery?: string,
    @Query('userId') userIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;
    const locale = req?.user?.locale ?? 'pt-BR'; // Pega o locale do App

    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    if (id === 'my') {
      const userId = userIdFromQuery || this.getUserId(req);
      if (!userId) {
        throw new BadRequestException(
          'userId missing for /forms/my/submissions',
        );
      }
      // Assinatura: listMySubmissions(userId, companyId, page, pageSize, locale)
      return this.formsService.listMySubmissions(
        userId,
        companyId,
        pageNum,
        pageSizeNum,
        locale,
      );
    }

    // CMS (ou admin) pode listar
    const userId = this.getUserId(req);
    const role = req.user?.role;

    if (role === Role.User) {
      // App users cannot list all submissions of a form, only 'my'
      throw new ForbiddenException('App users cannot list submissions');
    }

    // Check ACL for Admins
    if (userId) {
      const caps = await this.accessControlService.capabilities(companyId, { id: userId, role });
      const formsCaps = caps.modules.forms;
      if (!formsCaps?.canView) {
        throw new ForbiddenException('No permission to view forms');
      }
      // Note: If scope is SPACE_IDS, we ideally should check if this specific form belongs to allowed spaces.
      // For now, we assume canView is enough, or we rely on the service to filter (but service listSubmissions doesn't filter by space yet).
      // Enhancing service listSubmissions is safer, but redundant if we block here.
    }

    return this.formsService.listSubmissions(
      companyId,
      id,
      userId ?? null,
      pageNum,
      pageSizeNum,
    );
  }

  // =========================================================
  // DETALHE DA SUBMISSÃO (APP)
  // =========================================================
  @Get(':id/submissions/:submissionId')
  async submissionDetail(
    @Req() req: any,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const locale = req?.user?.locale ?? 'pt-BR'; // Pega o locale
    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    // Assinatura: getSubmissionDetail(companyId, formId, submissionId, locale)
    return this.formsService.getSubmissionDetail(
      companyId,
      id,
      submissionId,
      locale,
    );
  }

  // =========================================================
  // RESPONDER SUBMISSÃO (CMS) - LEGADO S1
  // =========================================================
  @Post(':id/submissions/:submissionId/respond')
  async respond(
    @Req() req: any,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: RespondDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    // Assinatura: respond(companyId, formId, submissionId, actorUserId, dto)
    return this.formsService.respond(companyId, id, submissionId, userId, dto);
  }

  // =========================================================
  // 🔥 S3+: NOVOS ENDPOINTS DE CHAT
  // =========================================================

  @Get(':id/submissions/:submissionId/chat')
  // @UseGuards(FormsAclGuard) // TODO: Adicionar ACL
  async getChat(
    @Req() req: any,
    @Param('id') formId: string,
    @Param('submissionId') submissionId: string,
  ) {
    const companyId = this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');

    // ==================================
    // CORREÇÃO (Fase 1): Passa o ator (RH ou User)
    // Assumindo que o App usa um guard/rota diferente ou passa um query param ?actor=user
    // Para o CMS, o ator é sempre 'rh'.
    // ==================================
    const actor = req.query.actor === 'user' ? 'user' : 'rh';

    return this.formsService.getChatHistory(
      companyId,
      formId,
      submissionId,
      userId,
      actor, // Passa quem está lendo (para zerar o badge)
    );
  }

  @Post(':id/submissions/:submissionId/chat')
  // @UseGuards(FormsAclGuard) // TODO: Adicionar ACL
  async postChat(
    @Req() req: any,
    @Param('id') formId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: ChatMessageDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');

    // Garante que o ID do token sobreponha o do DTO
    const actorUserId = userId;

    // Se o DTO não trouxer o ator (ex: app vindo do CMS), assume 'rh'
    // Se o app enviar, ele deve mandar 'user'
    const actor = dto.actor || 'rh';

    return this.formsService.postChatMessage(
      companyId,
      formId,
      submissionId,
      actorUserId,
      { ...dto, userId: actorUserId, actor: actor }, // Força o userId e o ator
    );
  }

  @Post(':id/submissions/:submissionId/chat/close')
  // @UseGuards(FormsAclGuard) // TODO: Adicionar ACL (SÓ RH)
  async closeChat(
    @Req() req: any,
    @Param('id') formId: string,
    @Param('submissionId') submissionId: string,
  ) {
    const companyId = this.getCompanyIdSync(req);
    const userId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!userId) throw new BadRequestException('userId missing');

    // TODO: Adicionar verificação se o 'userId' é RH/Admin

    return this.formsService.closeChat(companyId, formId, submissionId, userId);
  }

  // =========================================================
  // NOTIF SETTINGS (CMS)
  // =========================================================
  @Get(':id/notification-settings')
  async getNotif(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    if (!companyId) {
      const userId = this.getUserId(req);
      if (userId) {
        companyId = await this.formsService.findCompanyIdByUser(userId);
      }
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    return this.formsService.getFormNotificationSettings(companyId, id);
  }

  @Post(':id/notification-settings')
  async saveNotif(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: { items: Array<{ spaceId: string | null; emails: string[] }> },
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const userId = this.getUserId(req); // Pega o ator
    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }
    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    // Assinatura: saveFormNotificationSettings(companyId, formId, actorUserId, items)
    return this.formsService.saveFormNotificationSettings(
      companyId,
      id,
      userId,
      body.items || [],
    );
  }
}
