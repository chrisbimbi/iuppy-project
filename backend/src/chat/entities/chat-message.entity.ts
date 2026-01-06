import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    DeleteDateColumn,
} from 'typeorm';
import { ChatConversationEntity } from './chat-conversation.entity';
import { ChatMessageReactionEntity } from './chat-message-reaction.entity';
import { UserEntity } from '../../users/user.entity';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VOICE = 'VOICE',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM',
}

@Entity('chat_message')
export class ChatMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    conversationId: string;

    @ManyToOne(() => ChatConversationEntity, (c) => c.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: ChatConversationEntity;

    @Column()
    senderId: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'senderId' })
    sender: UserEntity;

    @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
    type: MessageType;

    // Content acts as text body OR file url
    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;
    // e.g. { duration: 5, fileSize: 1024, replyToId: 'uuid', fileName: 'doc.pdf' }

    // Use JSONB for efficient reaction storage (Staffbase pattern)
    // Map<ReactionType, { id: string, name: string }[]>
    @Column({ type: 'jsonb', nullable: true, default: {} })
    reactions: Record<string, { id: string, name: string }[]>;

    @Column({ nullable: true })
    replyToId: string;

    @ManyToOne(() => ChatMessageEntity, { nullable: true })
    @JoinColumn({ name: 'replyToId' })
    replyTo: ChatMessageEntity;

    // Snapshot of the original message content/author to preserve context if original is deleted
    @Column({ type: 'jsonb', nullable: true })
    replySnapshot: {
        id: string;
        content: string;
        senderName: string;
    };

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
