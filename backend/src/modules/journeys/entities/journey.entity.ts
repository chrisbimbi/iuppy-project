import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CompanyEntity } from '../../../companies/company.entity';
import { JourneyStepEntity } from './journey-step.entity';

export enum JourneyTriggerType {
  ONBOARDING = 'ONBOARDING', // New users
  DATE_BASED = 'DATE_BASED', // Starts at specific date
  MANUAL = 'MANUAL',
  // Deprecated
  GLOBAL = 'GLOBAL',
  GROUP = 'GROUP',
}

export enum JourneyRestartPolicy {
  RESUME = 'RESUME',
  RESTART = 'RESTART',
}

@Entity('journeys')
export class JourneyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity;

  @Column({ nullable: true })
  spaceId: string; // Optional multi-tenant isolation

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: JourneyTriggerType,
    default: JourneyTriggerType.MANUAL,
  })
  triggerType: JourneyTriggerType;

  // New fields for Date-Based journeys
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // Flexible target audience (Space/Group rules)
  @Column({ type: 'jsonb', nullable: true })
  targetAudience: any;

  @Column({ nullable: true })
  targetGroupId: string; // Deprecated/Legacy support

  @Column({ nullable: true })
  gamificationId: string; // Link to gamification campaign

  @Column({
    type: 'enum',
    enum: JourneyRestartPolicy,
    default: JourneyRestartPolicy.RESUME,
  })
  restartPolicy: JourneyRestartPolicy;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isNr1: boolean;

  @OneToMany(() => JourneyStepEntity, (step) => step.journey)
  steps: JourneyStepEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
