import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('form_notification_setting')
@Index(['companyId'])
@Index(['companyId', 'formId'])
export class FormNotificationSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid', { nullable: true })
  formId: string | null

  @Column('text', { nullable: true })
  spaceId: string | null

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  emails: string[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date
}
