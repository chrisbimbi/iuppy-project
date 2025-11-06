// backend/src/v2/forms/forms.controller.ts
import {
  Body, Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards,
} from '@nestjs/common'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard'
import { FormsService, FormUpsertPayload } from './forms.service'

@UseGuards(JwtAccessGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly svc: FormsService) { }

  private companyId(req: any) {
    return String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
  }
  private userId(req: any) {
    return String(req.user?.userId || req.user?.id)
  }

  // LIST
  @Get()
  async list(@Req() req: any) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.list(companyId)
  }

  // GET
  @Get(':formId')
  async getOne(@Req() req: any, @Param('formId') formId: string) {
    return this.svc.get(this.companyId(req), formId)
  }

  // CREATE
  @Post()
  async create(@Req() req: any, @Body() body: FormUpsertPayload) {
    return this.svc.create(this.companyId(req), this.userId(req), body)
  }

  // UPDATE (parcial)
  @Patch(':formId')
  async update(@Req() req: any, @Param('formId') formId: string, @Body() body: Partial<FormUpsertPayload>) {
    return this.svc.update(this.companyId(req), formId, body)
  }

  // PUBLISH / UNPUBLISH
  @Post(':formId/publish')
  async publish(@Req() req: any, @Param('formId') formId: string) {
    return this.svc.publish(this.companyId(req), formId)
  }
  @Post(':formId/unpublish')
  async unpublish(@Req() req: any, @Param('formId') formId: string) {
    return this.svc.unpublish(this.companyId(req), formId)
  }

  // DUPLICATE
  @Post(':formId/duplicate')
  async duplicate(@Req() req: any, @Param('formId') formId: string) {
    return this.svc.duplicate(this.companyId(req), formId, this.userId(req))
  }

  // BULK DELETE
  @Delete()
  async deleteMany(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.svc.removeMany(this.companyId(req), body?.ids ?? [])
  }

  // SEGMENTATION OPTIONS
  @Get('segmentation/options/all')
  async segmentationOptions(@Req() req: any) {
    return this.svc.segmentationOptions(this.companyId(req))
  }

  // SUBMISSIONS (Inbox básica S1)
  @Get(':formId/submissions')
  async submissions(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.svc.submissions(this.companyId(req), formId, Number(page), Number(pageSize))
  }

  // RESPOND / APPROVE / REJECT
  @Post(':formId/submissions/:submissionId/respond')
  async respond(
    @Req() req: any,
    @Param('formId') formId: string,
    @Param('submissionId') submissionId: string,
    @Body() body: { type: 'reply' | 'approve' | 'reject'; message?: string },
  ) {
    return this.svc.respond(this.companyId(req), formId, submissionId, this.userId(req), body)
  }
}