import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { SearchV2Service } from './search.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TrackSearchDto } from './dto/track-search.dto';

@ApiTags('Search V2')
@ApiBearerAuth('bearer')
@Controller('v2/search')
@UseGuards(JwtAccessGuard)
export class SearchV2Controller {
  constructor(private readonly svc: SearchV2Service) {}

  @Post('track')
  @ApiBody({ type: TrackSearchDto })
  @ApiOkResponse({
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
  })
  track(@Req() req: any, @Body() dto: TrackSearchDto) {
    const u = req.user;
    return this.svc.track(u.companyId, String(u.sub), dto);
  }

  @Get('overview')
  @ApiQuery({ name: 'from', required: false, example: '1970-01-01T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, example: '2100-01-01T00:00:00Z' })
  overview(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const u = req.user;
    return this.svc.overview(u.companyId, from, to);
  }
}
