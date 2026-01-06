import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
} from 'typeorm';
import { SocialInteractionType } from '@shared/types';

@Entity('social_interaction_events')
@Index(['companyId', 'postId'])
@Index(['companyId', 'createdAt']) // Useful for heatmap/time-based queries
export class SocialInteractionEventEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    companyId!: string;

    @Column('uuid')
    postId!: string;

    @Column('uuid', { nullable: true })
    userId!: string | null;

    @Column('text')
    type!: SocialInteractionType;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @Column({ type: 'jsonb', nullable: true })
    meta?: Record<string, any>;
}
