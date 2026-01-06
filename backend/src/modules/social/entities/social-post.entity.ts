import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SocialPost, SocialPostMedia, SocialPostStatus } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';

@Entity('social_posts')
@Index(['companyId', 'channelId'])
@Index(['companyId', 'authorId'])
export class SocialPostEntity implements SocialPost {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    companyId!: string;

    @Column()
    channelId!: string;

    @Column()
    authorId!: string;

    @Column('text')
    content!: string;

    @Column('jsonb', { default: [] })
    media!: SocialPostMedia[];

    @Column({
        type: 'enum',
        enum: SocialPostStatus,
        default: SocialPostStatus.PENDING,
    })
    status!: SocialPostStatus;

    // Denormalized counts
    @Column({ type: 'int', default: 0 })
    reactionsCount!: number;

    @Column({ type: 'int', default: 0 })
    commentsCount!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @Column({ type: 'timestamptz', nullable: true })
    publishedAt?: string;

    // Relations
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'authorId' })
    author?: UserEntity;
}
