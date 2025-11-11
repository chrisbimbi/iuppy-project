// src/modules/forms/forms.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { RespondDto } from './dto/respond.dto';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

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

  // GET /forms
  @Get()
  async list(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      // CMS não manda companyId, então resolvemos pelo user
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.listForms(companyId, status);
  }

  // GET /forms/segments  (CMS usa)
  @Get('segments')
  async segments(
    @Req() req: any,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.segments(companyId);
  }

  // POST /forms
  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateFormDto,
  ) {
    let companyId = dto.companyId || this.getCompanyIdSync(req);
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

  // PATCH /forms/:id
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.updateForm(companyId, id, dto);
  }

  // GET /forms/:id
  @Get(':id')
  async detail(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.getForm(companyId, id);
  }

  // GET /forms/:id/submissions
  // se id === 'my' => minhas respostas
  @Get(':id/submissions')
  async listSubmissions(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
    @Query('companyId') companyIdQ?: string,
    @Query('userId') userIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const reqUserId = this.getUserId(req);
    const userId = userIdQ || reqUserId;

    if (!companyId && reqUserId) {
      companyId = await this.formsService.findCompanyIdByUser(reqUserId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 50;

    if (id === 'my') {
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

    return this.formsService.listSubmissions(
      companyId,
      id,
      reqUserId ?? null,
      pageNum,
      pageSizeNum,
    );
  }

  // POST /forms/:id/submissions/:submissionId/respond
  @Post(':id/submissions/:submissionId/respond')
  async respond(
    @Req() req: any,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: RespondDto,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
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

    return this.formsService.respond(
      companyId,
      id,
      submissionId,
      userId,
      dto,
    );
  }

  // GET /forms/:id/notification-settings
  @Get(':id/notification-settings')
  async getNotif(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
    }

    if (!companyId) {
      throw new BadRequestException('companyId missing');
    }

    return this.formsService.getFormNotificationSettings(companyId, id);
  }

  // POST /forms/:id/notification-settings
  @Post(':id/notification-settings')
  async saveNotif(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: { items: Array<{ spaceId: string | null; emails: string[] }> },
    @Query('companyId') companyIdQ?: string,
  ) {
    let companyId = companyIdQ || this.getCompanyIdSync(req);
    const userId = this.getUserId(req);

    if (!companyId && userId) {
      companyId = await this.formsService.findCompanyIdByUser(userId);
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
  
}
