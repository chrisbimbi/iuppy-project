import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('chat_message_hidden')
@Index(['userId', 'messageId'], { unique: true })
export class HiddenMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    messageId: string;

    @CreateDateColumn()
    createdAt: Date;
}
