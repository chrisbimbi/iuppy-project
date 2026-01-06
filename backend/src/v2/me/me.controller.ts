import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  async feed(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
    @Query() q: any,
  ): Promise<MeFeedResponseDTO> {
    const u = req.user;
    const companyId = q.companyId || u.companyId;
    const userId = String(u.id || u.sub);
    const ifNoneMatch = req.headers['if-none-match'];

    const query = {
      limit: q.limit ? Number(q.limit) : undefined,
      cursor: q.cursor ?? undefined,
      spaceId: q.spaceId ?? undefined,
      channelId: q.channelId ?? undefined,
    };

    const resp = await this.svc.meFeed(companyId, userId, query);

    if (resp?.etag) {
      res.setHeader('ETag', resp.etag);
    }
    if (
      ifNoneMatch &&
      resp?.etag &&
      String(ifNoneMatch) === String(resp.etag)
    ) {
      // 304 Not Modified sem corpo
      throw new HttpException('', HttpStatus.NOT_MODIFIED);
    }
    return resp;
  }
}
