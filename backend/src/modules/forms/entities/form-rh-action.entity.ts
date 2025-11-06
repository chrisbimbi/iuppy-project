// backend/src/modules/forms/entities/form-rh-action.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export type FormRhActionType = 'reply'|'approve'|'reject'

@Entity('form_rh_action')
@Index(['companyId','submissionId','formId'])
export class FormRhActionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column() @Index() submissionId!: string
  @Column() @Index() formId!: string

  @Column() actorUserId!: string
  @Column({ type: 'enum', enum: ['reply','approve','reject'] }) type!: FormRhActionType
  @Column('text', { nullable: true }) message!: string | null

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
}
