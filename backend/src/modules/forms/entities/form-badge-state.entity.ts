import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm'

@Entity('form_badge_state')
@Index(['companyId', 'cmsUserId', 'formId'], { unique: true })
export class FormBadgeStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  companyId: string

  @Column('uuid')
  cmsUserId: string

  @Column('uuid')
  formId: string

  @Column('timestamptz', { nullable: true })
  lastSeenAt: Date | null

  // badge azul (novas submissões)
  @Column({ type: 'int', default: 0 })
  newCount: number;

  // badge vermelho (erros de notificação, e-mail que não foi)
  @Column({ type: 'int', default: 0 })
  errorCount: number;
}
