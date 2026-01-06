import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { ChatParticipantEntity } from './chat-participant.entity';
import { ChatMessageEntity } from './chat-message.entity';

export enum ConversationType {
    DIRECT = 'DIRECT',
    GROUP = 'GROUP',
}

@Entity('chat_conversation')
export class ChatConversationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ConversationType, default: ConversationType.DIRECT })
    type: ConversationType;

    // For group chats
    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    avatarUrl: string;

    // If set, this conversation is linked to a system Group (e.g. Conditional/Mandatory)
    // Membership is derived from the group, not just participants table.
    @Column({ nullable: true, unique: true })
    linkedGroupId: string;

    // Most recent message date for sorting
    @Column({ type: 'timestamp', nullable: true })
    lastMessageAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ChatParticipantEntity, (p) => p.conversation)
    participants: ChatParticipantEntity[];

    @OneToMany(() => ChatMessageEntity, (m) => m.conversation)
    messages: ChatMessageEntity[];
}
