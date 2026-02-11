import {
    Entity,
    PrimaryGeneratedColumn,
    PrimaryColumn, // Added missing import
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { SpaceEntity } from './space.entity';

@Entity('user_space_entity')
@Index(['userId', 'spaceId'], { unique: true })
export class UserSpaceEntity {
    // Remove auto-generated ID, use composite key
    // @PrimaryGeneratedColumn('uuid')
    // id: string;

    @Column()
    companyId: string;

    @PrimaryColumn('uuid')
    userId: string;

    @PrimaryColumn('uuid')
    spaceId: string;

    // Found in DB
    @Column({ nullable: true })
    role?: string;

    @ManyToOne(() => UserEntity, (user) => user.userSpaces, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @ManyToOne(() => SpaceEntity, (space) => space.userSpaces, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'spaceId' })
    space: SpaceEntity;

    // Removed createdAt as it does not exist in DB table
    // @CreateDateColumn()
    // createdAt: Date;
}
