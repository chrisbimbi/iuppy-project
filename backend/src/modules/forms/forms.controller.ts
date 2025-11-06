import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard'
import { FormsService } from './forms.service'
import { CreateFormDto } from './dto/create-form.dto'
import { UpdateFormDto } from './dto/update-form.dto'
import { CreateSubmissionDto } from './dto/create-submission.dto'
import { RespondDto } from './dto/respond.dto'

@UseGuards(JwtAccessGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly svc: FormsService) {}

  @Get()
  async list(@Req() req: any, @Query('status') status?: string) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.listForms(companyId, status)
  }

  /** usado no CMS para popular Space/Group quando NÃO é empresa inteira */
  @Get('segments')
  async segments(@Req() req: any) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.segments(companyId)
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateFormDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const createdBy = String(req.user?.id || req.user?.sub)
    return this.svc.createForm(companyId, createdBy, { ...dto, companyId })
  }

  @Get(':formId')
  async get(@Req() req: any, @Param('formId') formId: string) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.getForm(companyId, formId)
  }

  @Patch(':formId')
  async update(@Req() req: any, @Param('formId') formId: string, @Body() dto: UpdateFormDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.updateForm(companyId, formId, dto)
  }

  // submissions (app + external + cms view)
  @Post(':formId/submissions')
  async submit(@Req() req: any, @Param('formId') formId: string, @Body() dto: CreateSubmissionDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const userId = String(req.user?.id || req.user?.sub || '')
    return this.svc.submit(companyId, formId, userId || null, dto)
  }

  @Get(':formId/submissions')
  async submissions(@Req() req: any, @Param('formId') formId: string, @Query('page') page = '1', @Query('pageSize') pageSize = '50') {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.listSubmissions(companyId, formId, Number(page), Number(pageSize))
  }

  @Post(':formId/submissions/:submissionId/respond')
  async respond(@Req() req: any, @Param('formId') formId: string, @Param('submissionId') sid: string, @Body() dto: RespondDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const actorUserId = String(req.user?.id || req.user?.sub)
    return this.svc.respond(companyId, formId, sid, actorUserId, dto)
  }
}