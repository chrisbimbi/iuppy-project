import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
// Assuming AuthGuard exists, usually JwtAuthGuard
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversations')
    async getConversations(@Req() req) {
        const result = await this.chatService.getUserConversations(req.user.sub);
        console.log('Get Conversations Result:', JSON.stringify(result, null, 2));
        return result;
    }

    @Post('conversations')
    async createConversation(@Req() req, @Body() body: { participantIds: string[]; name?: string }) {
        // Ensure current user is included
        const userId = req.user.sub;
        const participants = [...new Set([...body.participantIds, userId])];
        return this.chatService.createConversation(participants, body.name);
    }

    @Get('conversations/:id/messages')
    async getMessages(
        @Req() req,
        @Param('id') id: string,
        @Query('limit') limit = '20',
        @Query('before') before: string
    ) {
        return this.chatService.getMessages(id, req.user.sub, +limit, before);
    }
    @Get('unread-count')
    async getUnreadCount(@Req() req) {
        return this.chatService.getUnreadCount(req.user.sub);
    }

    @Post('conversations/:id/clear')
    async clearHistory(@Req() req, @Param('id') id: string) {
        return this.chatService.clearHistory(id, req.user.sub);
    }

    @Post('conversations/:id/mark-read')
    async markAsRead(@Req() req, @Param('id') id: string) {
        return this.chatService.markAsRead(id, req.user.sub);
    }

    @Post('conversations/:id/participants')
    async addParticipant(
        @Req() req,
        @Param('id') id: string,
        @Body() body: { userId: string }
    ) {
        return this.chatService.addParticipant(id, req.user.sub, body.userId);
    }

    @Delete('messages/:id')
    async deleteMessage(@Req() req, @Param('id') id: string, @Query('for') mode: string) {
        if (mode === 'me') {
            return this.chatService.deleteMessageForMe(id, req.user.sub);
        }
        return this.chatService.deleteMessage(id, req.user.sub);
    }

    @Get('messages/:id/info')
    async getMessageInfo(@Req() req, @Param('id') id: string) {
        return this.chatService.getMessageInfo(id, req.user.sub);
    }

    @Post('conversations/:id/participants/:userId/remove')
    async removeParticipant(
        @Req() req,
        @Param('id') id: string,
        @Param('userId') targetUserId: string
    ) {
        return this.chatService.removeParticipant(id, req.user.sub, targetUserId);
    }

    @Post('conversations/:id/participants/:userId/promote')
    async promoteParticipant(
        @Req() req,
        @Param('id') id: string,
        @Param('userId') targetUserId: string
    ) {
        return this.chatService.promoteToAdmin(id, req.user.sub, targetUserId);
    }
}
