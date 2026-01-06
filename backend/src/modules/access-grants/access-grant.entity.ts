import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('company_access_grants')
@Index(['companyId', 'userId', 'moduleKey'], { unique: true })
export class AccessGrantEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() companyId!: string;
  @Column() userId!: string;
  @Column() moduleKey!: string;

  @Column({ default: 'ALL_SPACES' }) scopeType!: 'ALL_SPACES' | 'SPACE_IDS';
  @Column('simple-array', { nullable: true }) spaceIds?: string[] | null;

  @Column({ default: true }) canView!: boolean;
  @Column({ default: false }) canEdit!: boolean;
  @Column({ default: false }) canManage!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
