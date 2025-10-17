import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('company_settings')
export class CompanySettingsEntity {
  @PrimaryColumn() companyId: string

  @Column({ default: 'pt' }) defaultLocale: string
  @Column('simple-array', { default: 'pt,en,es,de' }) supportedLocales: string[]

  // Branding
  @Column({ nullable: true }) logoUrl?: string
  @Column({ nullable: true }) appTitle?: string
  @Column({ nullable: true }) appSubtitle?: string

  @Column({ nullable: true }) primary?: string
  @Column({ nullable: true }) success?: string
  @Column({ nullable: true }) info?: string
  @Column({ nullable: true }) warning?: string
  @Column({ nullable: true }) danger?: string
  @Column({ nullable: true }) gray900?: string
  @Column({ nullable: true }) gray600?: string

  @Column({ nullable: true }) background?: string
  @Column({ nullable: true }) textOnBackground?: string

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}