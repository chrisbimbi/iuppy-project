import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ChatConversationEntity } from './chat-conversation.entity';
import { UserEntity } from '../../users/user.entity';

export enum ChatRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

@Entity('chat_participant')
export class ChatParticipantEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;



    @Column()
    conversationId: string;

    @ManyToOne(() => ChatConversationEntity, (c) => c.participants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: ChatConversationEntity;

    // Linked to generic user system (just storing userId string as we might not have a hard UserEntity relation here strictly or to avoid circular deps)
    // Assuming 'users' table exists, but we usually just store userId here if we want loose coupling or strict if we import UserEntity
    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'enum', enum: ChatRole, default: ChatRole.MEMBER })
    role: ChatRole;

    @Column({ type: 'timestamp', nullable: true })
    lastReadAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    clearedHistoryAt: Date;

    @Column({ default: false })
    isArchived: boolean;

    @Column({ default: false })
    isMuted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
