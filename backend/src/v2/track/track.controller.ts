import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TrackV2Service } from './track.service';

class TrackBatchDto {
  events!: Array<{ type: 'app_open'|'module_open'; at: string; meta?: Record<string, any> }>;
}

@UseGuards(JwtAccessGuard)
@Controller('v2/track')
export class TrackV2Controller {
  constructor(private readonly svc: TrackV2Service) {}

  @Post('batch')
  async batch(@Body() body: TrackBatchDto, @Req() req: any) {
    const userId = String(req.user?.id || req.user?.sub);
    const companyId = req.user?.companyId;
    return this.svc.batch(companyId, userId, body?.events || []);
  }
}