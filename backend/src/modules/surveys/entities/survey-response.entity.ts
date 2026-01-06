import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { SurveyEntity } from './survey.entity';

@Entity('survey_response')
export class SurveyResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SurveyEntity, (s) => s.responses, { onDelete: 'CASCADE' })
  survey: SurveyEntity;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column('jsonb')
  answers: {
    questionId: string;
    answer: string | string[] | number;
  }[];

  @CreateDateColumn()
  submittedAt: Date;
}
