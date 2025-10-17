// backend/src/modules/access-control/module-access-grant.entity.ts
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('module_access_grants')
@Index(['companyId', 'userId', 'moduleKey'], { unique: true })
export class ModuleAccessGrantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  companyId!: string

  @Column()
  userId!: string

  @Column()
  moduleKey!: string

  @Column({ type: 'text', default: 'ALL_SPACES' })
  scopeType!: 'ALL_SPACES' | 'SPACE_IDS'

  @Column('text', { array: true, default: '{}' })
  spaceIds!: string[]

  @Column({ type: 'boolean', default: false })
  canView!: boolean

  @Column({ type: 'boolean', default: false })
  canEdit!: boolean

  @Column({ type: 'boolean', default: false })
  canManage!: boolean

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}