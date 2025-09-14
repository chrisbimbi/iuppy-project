import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { MeService } from './me.service';
import type { MeFeedQuery } from '@shared/types/v2/feed';

@Controller('v2/me')
@UseGuards(JwtAccessGuard)
export class MeController {
  constructor(private svc: MeService) {}

  @Get('feed')
  feed(@Req() req: any, @Query() q: MeFeedQuery) {
    const user = req.user;
    return this.svc.meFeed(user.companyId, String(user.sub), q);
  }
}