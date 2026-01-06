import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatConversationEntity } from './entities/chat-conversation.entity';
import { ChatParticipantEntity } from './entities/chat-participant.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { ChatMessageReactionEntity } from './entities/chat-message-reaction.entity';
import { HiddenMessageEntity } from './entities/hidden-message.entity';
import { UserEntity } from '../users/user.entity';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ChatConversationEntity,
            ChatParticipantEntity,
            ChatMessageEntity,
            ChatMessageReactionEntity,
            HiddenMessageEntity,
            UserEntity,
        ]),
        GroupsModule, // Import GroupsModule to use GroupsService
        NotificationsModule,
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    exports: [ChatService],
})
export class ChatModule { }
