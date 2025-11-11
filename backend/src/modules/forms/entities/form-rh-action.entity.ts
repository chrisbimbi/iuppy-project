import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm'

export type FormRhActionType = 'reply' | 'approve' | 'reject'

@Entity('form_rh_action')
@Index(['companyId', 'formId', 'submissionId'])
export class FormRhActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  formId: string

  @Column('uuid')
  submissionId: string

  @Column('uuid')
  actorUserId: string

  @Column('text')
  type: FormRhActionType

  @Column('text', { nullable: true })
  message: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
