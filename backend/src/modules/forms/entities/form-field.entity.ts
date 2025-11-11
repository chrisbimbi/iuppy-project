import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm'

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'multi_choice'
  | 'single_choice'
  | 'stars'
  | 'scale'

@Entity('form_field')
@Index(['companyId', 'formId'])
export class FormFieldEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  companyId: string

  @Column('uuid')
  @Index()
  formId: string

  @Column('int', { default: 1 })
  version: number

  @Column('text')
  type: FormFieldType

  @Column('text')
  label: string

  @Column('boolean', { default: false })
  required: boolean

  @Column('jsonb', { nullable: true })
  options: any | null

  @Column('int', { default: 0, name: 'order' })
  order: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
