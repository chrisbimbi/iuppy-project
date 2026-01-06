import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

export type FormChatActor = 'user' | 'rh';

@Entity('form_submission_chat')
@Index(['companyId', 'submissionId', 'createdAt'])
export class FormSubmissionChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  @Index()
  submissionId: string;

  @Column('varchar', { length: 20 })
  actor: FormChatActor;

  @Column('uuid', { nullable: true })
  userId: string | null; // ID do usuário do CMS (RH) ou do App (Colaborador)

  @Column('text')
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
