// backend/src/modules/forms/entities/form.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

export type FormStatus = 'draft'|'published'|'expired'|'archived'

@Entity('form')
@Index(['companyId', 'status'])
export class FormEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column() @Index() companyId!: string
  @Column('text') title!: string
  @Column('text', { nullable: true }) description!: string | null

  @Column({ type: 'enum', enum: ['draft','published','expired','archived'], default: 'draft' })
  status!: FormStatus

  @Column({ type: 'timestamptz', nullable: true }) scheduleStartAt!: Date | null
  @Column({ type: 'timestamptz', nullable: true }) scheduleEndAt!: Date | null
  @Column({ type: 'timestamptz', nullable: true }) deadlineAt!: Date | null

  @Column({ type: 'boolean', default: false }) allowMultipleSubmissions!: boolean
  @Column({ type: 'boolean', default: false }) anonymous!: boolean
  @Column({ type: 'boolean', default: false }) allowExternal!: boolean

  @Column('text', { array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  audienceSpaceIds!: string[]

  @Column('text', { array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  audienceGroupIds!: string[]

  @Column({ type: 'boolean', default: true }) attachmentsAllowed!: boolean
  @Column('text', { nullable: true }) attachmentHelpText!: string | null

  @Column({ type: 'jsonb', nullable: true }) remindersConfig!: Record<string, any> | null
  @Column({ type: 'jsonb', nullable: true }) notificationsConfig!: Record<string, any> | null
  @Column({ type: 'jsonb', nullable: true }) acl!: Record<string, any> | null

  @Column() createdBy!: string
  @Column({ type: 'timestamptz', nullable: true }) publishedAt!: Date | null
  @Column({ type: 'int', default: 1 }) version!: number

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date
}
