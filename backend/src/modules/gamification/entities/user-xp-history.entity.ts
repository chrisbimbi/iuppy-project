
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UserEntity } from '../../../users/user.entity';

export enum GamificationActionType {
    JOURNEY_STEP = 'JOURNEY_STEP',
    JOURNEY_COMPLETION = 'JOURNEY_COMPLETION',
    NEWS_READ = 'NEWS_READ',
    NEWS_REACTION = 'NEWS_REACTION',
    NEWS_COMMENT = 'NEWS_COMMENT',
    NEWS_SHARE = 'NEWS_SHARE',
    SURVEY_COMPLETION = 'SURVEY_COMPLETION',
    SOCIAL_POST = 'SOCIAL_POST',
    SOCIAL_COMMENT = 'SOCIAL_COMMENT',
    SOCIAL_REACTION = 'SOCIAL_REACTION',
    SOCIAL_SHARE = 'SOCIAL_SHARE',
    MANUAL_AWARD = 'MANUAL_AWARD',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    VIDEO_WATCH = 'VIDEO_WATCH',
    FORM_SUBMISSION = 'FORM_SUBMISSION',
    AGREEMENT_ACCEPT = 'AGREEMENT_ACCEPT',
}

@Entity('user_xp_history')
@Index(['userId', 'createdAt']) // For history queries
@Index(['userId', 'actionType', 'createdAt']) // For daily cap checks
export class UserXPHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => UserEntity, user => user.xpHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column('int')
    amount: number;

    @Column({
        type: 'enum',
        enum: GamificationActionType,
    })
    actionType: GamificationActionType;

    // ID of the related entity (Step ID, News ID, etc)
    @Column({ type: 'text', nullable: true })
    sourceId: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    // JSON metadata (e.g. who gave manual award)
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;
}
