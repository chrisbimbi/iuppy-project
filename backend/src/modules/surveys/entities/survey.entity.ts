// backend/src/modules/surveys/entities/survey.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SurveyQuestionEntity } from './survey-question.entity';
import { SurveyResponseEntity } from './survey-response.entity';

export type SurveyStatus = 'draft' | 'published' | 'archived';
export type SurveyVisibility = 'public' | 'private' | 'specific_groups' | 'journey_only';

@Entity('survey')
export class SurveyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  authorId: string;

  @Column('text', { array: true })
  adminIds: string[];

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  spaceIds!: string[];

  // --- visibilidade / grupos ---
  @Column({
    type: 'enum',
    enum: ['public', 'private', 'specific_groups', 'journey_only'],
    default: 'public',
  })
  visibility: SurveyVisibility;

  @Column('text', {
    array: true,
    nullable: true,
    default: () => 'ARRAY[]::text[]',
  })
  groupIds?: string[];

  // --- notificações / entrega ---
  @Column({ default: false })
  notifyUsers: boolean;

  @Column({ default: false })
  emailNotification: boolean;

  @Column({ default: false })
  inAppNotification: boolean;

  @Column({ default: false })
  pushNotification: boolean;

  @Column({ type: 'text', nullable: true })
  pushTitle?: string;

  @Column({ type: 'text', nullable: true })
  pushContent?: string;

  @Column({ default: false })
  acknowledgementRequired: boolean;

  // --- agendamento / expiração ---
  @Column({ default: false })
  scheduleSurvey: boolean;

  @Column({ default: false })
  expireSurvey: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  // ---
  @Column({ default: false })
  isAnonymous: boolean;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: SurveyStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SurveyQuestionEntity, (q) => q.survey, { cascade: true })
  questions: SurveyQuestionEntity[];

  @OneToMany(() => SurveyResponseEntity, (r) => r.survey)
  responses: SurveyResponseEntity[];
}
