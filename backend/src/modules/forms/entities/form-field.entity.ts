// backend/src/modules/forms/entities/form-field.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export type FormFieldType = 'short_text'|'long_text'|'number'|'date'|'multi_choice'|'single_choice'|'stars'|'scale'

@Entity('form_field')
@Index(['companyId', 'formId', 'version'])
export class FormFieldEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column() @Index() formId!: string
  @Column({ type: 'int', default: 1 }) version!: number

  @Column({ type: 'enum', enum: ['short_text','long_text','number','date','multi_choice','single_choice','stars','scale'] })
  type!: FormFieldType

  @Column('text') label!: string
  @Column({ type: 'boolean', default: false }) required!: boolean
  @Column({ type: 'jsonb', nullable: true }) options!: Record<string, any> | null
  @Column({ type: 'int', default: 0 }) order!: number

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
}
