
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index
} from 'typeorm';

export enum BadgeRuleType {
    XP_THRESHOLD = 'XP_THRESHOLD',
    NEWS_READ_COUNT = 'NEWS_READ_COUNT',
    SURVEY_COUNT = 'SURVEY_COUNT',
    JOURNEY_STEP_COUNT = 'JOURNEY_STEP_COUNT',
    MANUAL = 'MANUAL',
}

@Entity('gamification_badge')
export class BadgeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string; // e.g. 'news-enthusiast-1'

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    iconUrl: string;

    @Column({
        type: 'enum',
        enum: BadgeRuleType,
        default: BadgeRuleType.MANUAL
    })
    ruleType: BadgeRuleType;

    @Column('int', { default: 0 })
    ruleValue: number; // e.g. 10 (reads)

    @Column({ default: false })
    isNr1: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
