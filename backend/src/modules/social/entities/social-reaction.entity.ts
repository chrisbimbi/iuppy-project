import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { SocialReaction } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';
import { SocialPostEntity } from './social-post.entity';

@Entity('social_reactions')
@Unique(['postId', 'userId', 'type']) // One reaction per user per post (per type)
@Index(['postId'])
export class SocialReactionEntity implements SocialReaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    companyId!: string;

    @Column()
    postId!: string;

    @Column()
    userId!: string;

    @Column({ default: 'LIKE' })
    type!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    // Relations
    @ManyToOne(() => SocialPostEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post?: SocialPostEntity;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user?: UserEntity;
}
