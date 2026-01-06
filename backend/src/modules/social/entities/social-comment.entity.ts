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
import { SocialComment } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';
import { SocialPostEntity } from './social-post.entity';

@Entity('social_comments')
@Index(['postId'])
export class SocialCommentEntity implements SocialComment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    companyId!: string;

    @Column()
    postId!: string;

    @Column()
    authorId!: string;

    @Column('text')
    content!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    // Relations
    @ManyToOne(() => SocialPostEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post?: SocialPostEntity;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'authorId' })
    author?: UserEntity;
}
