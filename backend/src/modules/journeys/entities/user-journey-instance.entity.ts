import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JourneyEntity } from './journey.entity';

export enum JourneyInstanceStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

import { UserEntity } from '../../../users/user.entity';

@Entity('user_journey_instances')
export class UserJourneyInstanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  userId: string;

  @Column()
  journeyId: string;

  @ManyToOne(() => JourneyEntity)
  @JoinColumn({ name: 'journeyId' })
  journey: JourneyEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'timestamp' })
  startDate: Date; // The anchor date (Day 1)

  @Column({ type: 'int', default: 0 })
  currentStep: number; // Index of the last completed step

  @Column({
    type: 'enum',
    enum: JourneyInstanceStatus,
    default: JourneyInstanceStatus.ACTIVE,
  })
  status: JourneyInstanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', default: [] })
  notificationsSent: string[]; // Array of stepIds

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
