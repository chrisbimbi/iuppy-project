import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AudienceService } from '../audience/audience.service';
import { AudienceMode } from '@shared/types/NewsSettings';

@Controller('v2/audience')
@UseGuards(JwtAccessGuard)
export class AudienceV2Controller {
  constructor(private readonly svc: AudienceService) {}

  @Post('probe')
  async probeDraft(@Req() req: any, @Body() body: any) {
    const companyId = req.user?.companyId;
    const mode = (body?.mode || body?.audienceMode) as AudienceMode;
    const params = body || {};
    return this.svc.probe(companyId, mode, params);
  }
}

@Controller('v2/news/:newsId/audience')
@UseGuards(JwtAccessGuard)
export class NewsAudienceV2Controller {
  constructor(private readonly svc: AudienceService) {}

  @Post('probe')
  async probeNews(
    @Req() req: any,
    @Param('newsId') newsId: string,
    @Body() body: any,
  ) {
    const companyId = req.user?.companyId;
    const mode = (body?.mode || body?.audienceMode) as AudienceMode;
    const params = { ...body, newsId };
    return this.svc.probe(companyId, mode, params);
  }

  @Post('apply')
  async apply(
    @Req() req: any,
    @Param('newsId') newsId: string,
    @Body() body: any,
  ) {
    const companyId = req.user?.companyId;
    return this.svc.applySelectionToNews(companyId, newsId, body);
  }
}
