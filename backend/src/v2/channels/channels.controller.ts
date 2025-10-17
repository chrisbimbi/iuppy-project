import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { ChannelsV2Service } from './channels.service';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Channels V2')
@ApiBearerAuth('bearer')
@Controller('v2/channels')
@UseGuards(JwtAccessGuard)
export class ChannelsV2Controller {
  constructor(private readonly svc: ChannelsV2Service) {}

  @Get()
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'spaceId', required: false, schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({
    description: 'Lista de canais visíveis ao usuário (opcional: filtrados por spaceId)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          spaceId: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string' },
          slug: { type: 'string' },
          position: { type: 'number', nullable: true },
        },
      },
    },
  })
  list(@Req() req: any, @Query('spaceId') spaceId?: string, @Query('companyId') companyId?: string) {
    const u = req.user;
    const cid = companyId || u.companyId;
    const uid = String(u.id || u.sub);
    return this.svc.listVisibleChannels(cid, uid, spaceId);
  }
}