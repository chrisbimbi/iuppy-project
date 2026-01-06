import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { SpacesV2Service } from './spaces.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Spaces V2')
@ApiBearerAuth('bearer')
@Controller('v2/spaces')
@UseGuards(JwtAccessGuard)
export class SpacesV2Controller {
  constructor(private readonly svc: SpacesV2Service) {}

  @Get()
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiOkResponse({
    description: 'Lista de espaços visíveis ao usuário',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          position: { type: 'number', nullable: true },
        },
      },
    },
  })
  list(@Req() req: any, @Query('companyId') companyId?: string) {
    const u = req.user;
    const cid = companyId || u.companyId;
    const uid = String(u.id || u.sub);
    return this.svc.listVisibleSpaces(cid, uid);
  }
}
