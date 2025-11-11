import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm'

@Entity('form_answer')
@Index(['companyId', 'submissionId'])
@Index(['companyId', 'formId', 'fieldId'])
export class FormAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  submissionId: string

  @Column('uuid')
  formId: string

  @Column('uuid')
  fieldId: string

  @Column('text', { nullable: true })
  type: string | null

  @Column('jsonb')
  value: any

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
