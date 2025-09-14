import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { PushV2Service } from './push.service';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { RemindDto } from './dto/remind.dto';

@ApiTags('Push V2')
@ApiBearerAuth('bearer')
@Controller('v2/news')
@UseGuards(JwtAccessGuard)
export class PushV2Controller {
  constructor(private readonly svc: PushV2Service) {}

  @Post(':id/push/remind')
  @ApiParam({ name: 'id', description: 'NewsId', format: 'uuid' })
  @ApiBody({ type: RemindDto })
  remind(@Req() req: any, @Param('id') newsId: string, @Body() dto: RemindDto) {
    const u = req.user;
    return this.svc.enqueueRemind(u.companyId, newsId, String(u.sub), dto.onlyNotOpened ?? true);
  }
}