// src/modules/forms/forms-events.controller.ts
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FormsEventsService, FormEventType } from './forms-events.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';

class TrackEventDto {
  type!: FormEventType;
  fieldId?: string;
  meta?: Record<string, any>;
  external?: boolean;
  externalEmail?: string;
}

@Controller('v2/forms/:formId/events')
@UseGuards(JwtAccessGuard)
export class FormsEventsController {
  constructor(private readonly svc: FormsEventsService) {}

  @Post()
  async track(
    @Param('formId') formId: string,
    @Body() dto: TrackEventDto,
    @Req() req: any,
  ) {
    const companyId: string =
      req?.user?.companyId ||
      req?.user?.company?.id ||
      req?.headers?.['x-company-id'] ||
      req?.query?.companyId;

    if (!companyId) {
      return { ok: false, reason: 'companyId missing' };
    }

    const userId = dto.external
      ? null
      : req?.user?.id || req?.user?.sub || null;

    await this.svc.insertEvent({
      companyId,
      formId,
      type: dto.type,
      userId,
      external: !!dto.external,
      externalEmail: dto.externalEmail ?? null,
      fieldId: dto.fieldId ?? null,
      meta: dto.meta ?? null,
    });

    return { ok: true };
  }
}
