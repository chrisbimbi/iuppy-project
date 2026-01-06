import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UserEntity } from '../../users/user.entity';

@Controller('social')
@UseGuards(JwtAccessGuard)
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    @Post('posts')
    async createPost(
        @Req() req: { user: UserEntity },
        @Body() body: { channelId: string; content: string; media?: any[] },
    ) {
        console.log('CREATE POST REQ.USER:', req.user);
        return this.socialService.createPost(
            req.user.companyId,
            req.user.id,
            body.channelId,
            body.content,
            body.media || [],
        );
    }

    @Get('feed')
    async getFeed(
        @Req() req: { user: UserEntity },
        @Query('channelIds') channelIdsRaw: string, // comma separated
        @Query('page') page: number,
    ) {
        // TODO: Verify user has access to these channels via AccessControlService
        const channelIds = channelIdsRaw ? channelIdsRaw.split(',') : [];
        // If empty, should we fetch ALL allowed channels? 
        // For now assuming frontend sends the list of channels context.

        return this.socialService.getFeed(req.user.companyId, req.user.id, channelIds, req.user.groups || [], page);
    }

    @Get('posts/:id')
    async getPost(@Req() req: { user: UserEntity }, @Param('id') id: string) {
        return this.socialService.getPost(req.user.companyId, id);
    }

    @Post('posts/:id/reactions')
    async toggleReaction(
        @Req() req: { user: UserEntity },
        @Param('id') id: string,
    ) {
        return this.socialService.addReaction(req.user.companyId, req.user.id, id);
    }

    @Post('posts/:id/comments')
    async addComment(
        @Req() req: { user: UserEntity },
        @Param('id') id: string,
        @Body() body: { content: string }
    ) {
        return this.socialService.addComment(req.user.companyId, req.user.id, id, body.content);
    }
}
