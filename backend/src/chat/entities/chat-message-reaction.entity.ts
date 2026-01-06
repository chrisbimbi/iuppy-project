import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@Entity('chat_message_reaction')
export class ChatMessageReactionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    messageId: string;

    @ManyToOne(() => ChatMessageEntity, (m) => m.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message: ChatMessageEntity;

    @Column()
    userId: string;

    @Column()
    reaction: string; // Emoji char

    @CreateDateColumn()
    createdAt: Date;
}
