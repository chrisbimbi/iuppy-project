// src/v2/channels/channels.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { ChannelsV2Service } from './channels.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from 'src/channels/channel.entity';

@ApiTags('Channels V2')
@ApiBearerAuth('bearer')
@Controller('v2/channels')
@UseGuards(JwtAccessGuard)
export class ChannelsV2Controller {
  constructor(
    private readonly svc: ChannelsV2Service,
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
  ) {}

  // ---------- LIST ----------
  @Get()
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({
    description:
      'Lista de canais visíveis ao usuário (opcional: filtrados por spaceId)',
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
  list(
    @Req() req: any,
    @Query('spaceId') spaceId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const u = req.user;
    const cid = companyId || u.companyId;
    const uid = String(u.id || u.sub);
    return this.svc.listVisibleChannels(cid, uid, spaceId);
  }

  // ---------- GET ONE (para Audience no front) ----------
  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'Channel ID (uuid)' })
  @ApiOkResponse({
    description:
      'Retorna dados mínimos do canal (para audience probe no front)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', nullable: true },
        spaceIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  async getOne(@Req() req: any, @Param('id') id: string) {
    const companyId = req.user?.companyId;
    // Garante que o canal é da mesma empresa do usuário
    const ch = await this.channelRepo.findOne({ where: { id, companyId } });
    if (!ch) throw new NotFoundException('Channel not found');

    const name = (ch as any).name ?? (ch as any).title ?? null;

    // Suporta tanto schema com spaceId único quanto com spaceIds[]
    const spaceIdSingle = (ch as any).spaceId ?? (ch as any).space_id ?? null;
    const spaceIdsArray: string[] = Array.isArray((ch as any).spaceIds)
      ? (ch as any).spaceIds.map(String)
      : spaceIdSingle
        ? [String(spaceIdSingle)]
        : [];

    return {
      id: String((ch as any).id),
      name,
      spaceIds: spaceIdsArray,
    };
  }
}
