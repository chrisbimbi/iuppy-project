import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // WebSockets usually need custom guard or JWT extraction from handshake

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('ChatGateway');

    constructor(
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService
    ) { }

    handleConnection(client: Socket) {
        // In a real app, validate token here: client.handshake.auth.token
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        client.join(conversationId);
        this.logger.log(`Client ${client.id} joined room ${conversationId}`);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        client.leave(conversationId);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string, content: string, type?: string, metadata?: any, replyToId?: string }
    ) {
        // Mock user extraction from client (assume we stored it in handleConnection)
        // const userId = client.data.user.id; 
        const userId = client.handshake.headers['x-user-id'] as string; // Temp hack for quick proto

        if (!userId) {
            // client.emit('error', 'Unauthorized');
            return;
        }

        const msg = await this.chatService.saveMessage(
            payload.conversationId,
            userId,
            payload.content,
            (payload.type as any) || 'TEXT',
            payload.metadata,
            payload.replyToId
        );

        // Emit to room
        // Emit to room
        this.server.to(payload.conversationId).emit('newMessage', msg);
    }

    @SubscribeMessage('reaction')
    async handleReaction(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { messageId: string, reaction: string, conversationId: string }
    ) {
        const userId = client.handshake.headers['x-user-id'] as string;
        if (!userId) return;

        const updatedMsg = await this.chatService.toggleReaction(payload.messageId, userId, payload.reaction);
        this.server.to(payload.conversationId).emit('messageUpdated', updatedMsg);
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        const userId = client.handshake.headers['x-user-id'] as string;
        client.to(conversationId).emit('userTyping', { conversationId, userId });
    }
}
