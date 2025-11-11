// src/modules/forms/forms.controller.ts
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
} from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { RespondDto } from './dto/respond.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) { }

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
  //  // =========================================================
  // SEGMENTAÇÃO
  // =========================================================
  @UseGuards(JwtAccessGuard)
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
  // LISTAR FORMS
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Get()
  async list(
    @Req() req: any,
    @Query('status') status?: string,
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
    return this.formsService.listForms(companyId, status);
  }

  // =========================================================
  // CRIAR FORM
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateFormDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    // LOG do que veio
    console.log('[forms.controller][create] body =', JSON.stringify(dto, null, 2));

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
    return this.formsService.createForm(companyId, userId, dto);
  }

  // =========================================================
  // ATUALIZAR FORM
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @Query('companyId') companyIdFromQuery?: string,
  ) {
    // LOG do que veio
    console.log(
      '[forms.controller][update] id=',
      id,
      'dto=',
      JSON.stringify(dto, null, 2),
    );

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
    return this.formsService.updateForm(companyId, id, dto);
  }

  // =========================================================
  // DETALHE FORM
  // =========================================================
  @UseGuards(JwtAccessGuard)
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
  // SUBMIT (APP LOGADO) - endpoint novo
  // =========================================================
  @UseGuards(JwtAccessGuard)
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

  // alias para submissão antiga
  @UseGuards(JwtAccessGuard)
  @Post(':id/submissions')
  async submitInternalAlias(
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

  // =========================================================
  // SUBMIT (PÚBLICO / EXTERNO)
  // =========================================================
  @Post([
    'public/:id/submit',
    'public/:id/submissions',
    'v2/public/:id/submit',
    'v2/public/:id/submissions',
  ])
  async submitPublic(
    @Param('id') id: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    const form = await this.formsService.findFormById(id);
    if (!form) {
      throw new NotFoundException('form not found');
    }

    if (!form.allowExternal) {
      throw new ForbiddenException('external submissions not allowed');
    }

    const companyId = form.companyId;
    if (!companyId) {
      throw new BadRequestException('form without companyId');
    }

    return this.formsService.submit(companyId, id, null, {
      ...dto,
      external: true,
    });
  }

  // =========================================================
  // LISTAR SUBMISSÕES
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Get(':id/submissions')
  async listSubmissions(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('companyId') companyIdFromQuery?: string,
    @Query('userId') userIdFromQuery?: string,
  ) {
    let companyId = companyIdFromQuery || this.getCompanyIdSync(req);
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;

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
      return this.formsService.listMySubmissions(
        userId,
        companyId,
        pageNum,
        pageSizeNum,
      );
    }

    const userId = this.getUserId(req);
    return this.formsService.listSubmissions(
      companyId,
      id,
      userId ?? null,
      pageNum,
      pageSizeNum,
    );
  }

  // =========================================================
  // RESPONDER SUBMISSÃO
  // =========================================================
  @UseGuards(JwtAccessGuard)
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

    return this.formsService.respond(companyId, id, submissionId, userId, dto);
  }

  // =========================================================
  // NOTIF SETTINGS
  // =========================================================
  @UseGuards(JwtAccessGuard)
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

  @UseGuards(JwtAccessGuard)
  @Post(':id/notification-settings')
  async saveNotif(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: { items: Array<{ spaceId: string | null; emails: string[] }> },
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
    return this.formsService.saveFormNotificationSettings(
      companyId,
      id,
      body.items || [],
    );
  }
  // =========================================================
  // DETALHE DA SUBMISSÃO (APP)  👈 faltava esse
  // =========================================================
  @UseGuards(JwtAccessGuard)
  @Get(':id/submissions/:submissionId')
  async submissionDetail(
    @Req() req: any,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
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

    // 👇 esse cara já existe no service e já monta answers, attachments, rhActions
    return this.formsService.getSubmissionDetail(
      companyId,
      id,
      submissionId,
    );
  }
}