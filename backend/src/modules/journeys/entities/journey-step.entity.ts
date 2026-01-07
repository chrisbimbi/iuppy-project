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

export enum StepContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  QUIZ = 'QUIZ',
  POLL = 'POLL',
  FORM = 'FORM',
}

export enum StepMediaType {
  NONE = 'NONE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

@Entity('journey_steps')
export class JourneyStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journeyId: string;

  @ManyToOne(() => JourneyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journeyId' })
  journey: JourneyEntity;

  @Column()
  title: string;

  @Column({ type: 'int', default: 0 })
  delayDays: number; // Days after start

  @Column({ type: 'time', nullable: true })
  releaseTime: string; // HH:MM

  @Column({ nullable: true })
  pushTitle: string;

  @Column({ nullable: true })
  pushMessage: string;

  @Column({
    type: 'enum',
    enum: StepContentType,
  })
  contentType: StepContentType;

  @Column({
    type: 'enum',
    enum: StepMediaType,
    default: StepMediaType.NONE,
  })
  mediaType: StepMediaType;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  videoConfig: any; // { resolution: '720p', duration: 120, ... }

  @Column({ default: false })
  requireAck: boolean;

  @Column({ type: 'jsonb', nullable: true })
  formConfig: any;

  @Column({ type: 'jsonb', nullable: true })
  pollConfig: any;

  @Column({ type: 'jsonb', nullable: true })
  contentPayload: any;

  @Column({ type: 'jsonb', nullable: true })
  smartFields: any; // Configuration for personalization

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'int', nullable: true })
  xpOverride?: number;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
