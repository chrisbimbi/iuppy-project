import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MeService } from './me.service';
import type { MeFeedResponseDTO } from './dto/me-feed.dto';

@ApiTags('Me V2')
@ApiBearerAuth('bearer')
@UseGuards(JwtAccessGuard)
@Controller('v2/me')
export class MeController {
  constructor(private readonly svc: MeService) {}

  @Get('feed')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'spaceId', required: false, type: String })
  @ApiQuery({ name: 'channelId', required: false, type: String })
  @ApiOkResponse({ description: 'Feed + counters' })
  async feed(@Req() req: any, @Query() q: any): Promise<MeFeedResponseDTO> {
    const u = req.user;
    const companyId = q.companyId || u.companyId;
    const userId = String(u.id || u.sub);
    const query = {
      limit: q.limit ? Number(q.limit) : undefined,
      cursor: q.cursor ?? undefined,
      spaceId: q.spaceId ?? undefined,
      channelId: q.channelId ?? undefined,
    };
    return this.svc.meFeed(companyId, userId, query);
  }
}