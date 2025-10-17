import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { SurveyEntity } from './survey.entity';

export type QuestionType = 'text' | 'single' | 'multi' | 'stars' | 'scale' | 'nps';

@Entity('survey_question')
export class SurveyQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SurveyEntity, s => s.questions, { onDelete: 'CASCADE' })
  survey: SurveyEntity;

  @Column()
  order: number;

  @Column({ type: 'enum', enum: ['text','single','multi','stars','scale','nps'] })
  type: QuestionType;

  @Column()
  questionText: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: false })
  shuffleOptions: boolean;

  @Column('text', { array: true, nullable: true })
  options?: string[];
}