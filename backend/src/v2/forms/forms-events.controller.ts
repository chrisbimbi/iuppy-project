import { Body, Controller, Post, Param, Req, UseGuards } from '@nestjs/common'
import { FormsEventsService, FormEventType } from './forms-events.service'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard'

class TrackEventDto {
  type!: FormEventType
  fieldId?: string
  meta?: Record<string, any>
  external?: boolean
  externalEmail?: string
}

@UseGuards(JwtAccessGuard)
@Controller('v2/forms/:formId/events')
export class FormsEventsController {
  constructor(private readonly svc: FormsEventsService) {}

  @Post()
  async track(@Param('formId') formId: string, @Body() dto: TrackEventDto, @Req() req: any) {
    const companyId: string = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const userId: string | null = dto.external ? null : String(req.user?.userId || req.user?.id)

    // S1: somente "form_open" e "form_start"
    if (!['form_open', 'form_start'].includes(dto.type)) {
      return { ok: true, ignored: dto.type }
    }

    await this.svc.insertEvent({
      companyId,
      formId,
      userId,
      external: !!dto.external,
      externalEmail: dto.externalEmail ?? null,
      type: dto.type,
      fieldId: dto.fieldId ?? null,
      meta: dto.meta ?? null,
    })
    return { ok: true }
  }
}