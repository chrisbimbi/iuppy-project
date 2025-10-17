import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { FeedV2Service } from './feed.service';
// opcional: se você criou um DTO para tipar a resposta
// import { MeFeedResponseDto } from '../me/dto/me-feed.dto';

@ApiTags('Me V2')
@ApiBearerAuth('bearer')
@Controller('v2/me')
@UseGuards(JwtAccessGuard)
export class FeedV2Controller {
    constructor(private readonly feed: FeedV2Service) { }

    @Get('feed')
    @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50 } })
    @ApiQuery({ name: 'cursor', required: false, type: String })
    @ApiQuery({ name: 'spaceId', required: false, schema: { type: 'string', format: 'uuid' } })
    @ApiQuery({ name: 'channelId', required: false, schema: { type: 'string', format: 'uuid' } })
    @ApiOkResponse({
        description: 'Feed segmentado do usuário + counters',
    })
    async getFeed(
        @Req() req: any,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
        @Query('spaceId') spaceId?: string,
        @Query('channelId') channelId?: string,
    ) {
        const u = req.user;
        const companyId = String(u.companyId);
        const userId = String(u.id || u.sub);

        const lim = Number.isFinite(Number(limit)) ? Number(limit) : undefined;

        return this.feed.getFeed(companyId, userId, {
            limit: lim,
            cursor,
            spaceId,
            channelId,
        });
    }
}