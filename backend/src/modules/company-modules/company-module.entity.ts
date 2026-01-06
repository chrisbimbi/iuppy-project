import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('company_modules')
@Index(['companyId', 'key'], { unique: true })
export class CompanyModuleEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() companyId!: string;
  @Column() key!: string;
  @Column({ default: true }) enabled!: boolean;

  @Column({ type: 'jsonb', nullable: true }) config?: Record<
    string,
    any
  > | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
