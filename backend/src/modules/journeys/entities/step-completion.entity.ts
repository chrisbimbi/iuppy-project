import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserJourneyInstanceEntity } from './user-journey-instance.entity';
import { JourneyStepEntity } from './journey-step.entity';

@Entity('step_completions')
export class StepCompletionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;





  @Column()
  instanceId: string;

  @ManyToOne(() => UserJourneyInstanceEntity)
  @JoinColumn({ name: 'instanceId' })
  instance: UserJourneyInstanceEntity;

  @Column()
  stepId: string;

  @ManyToOne(() => JourneyStepEntity)
  @JoinColumn({ name: 'stepId' })
  step: JourneyStepEntity;

  @CreateDateColumn()
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: any;
}


