
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { UserEntity } from '../../../users/user.entity';
import { BadgeEntity } from './badge.entity';

@Entity('user_badge')
@Index(['userId', 'badgeId'], { unique: true })
export class UserBadgeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column('uuid')
    badgeId: string;

    @ManyToOne(() => BadgeEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'badgeId' })
    badge: BadgeEntity;

    @CreateDateColumn()
    awardedAt: Date;
}
