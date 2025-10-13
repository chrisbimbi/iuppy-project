import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type DevicePlatform = 'web' | 'android' | 'ios'

@Entity('user_device')
@Index(['companyId', 'userId'])
@Index(['companyId', 'token'], { unique: true })
export class UserDeviceEntity {
  @PrimaryGeneratedColumn('uuid') id!: string

  @Column('uuid') companyId!: string
  @Column('uuid') userId!: string

  @Column('text') platform!: DevicePlatform
  @Column('text') token!: string

  @Column('text', { nullable: true }) deviceId!: string | null
  @Column('text', { nullable: true }) userAgent!: string | null
  @Column('text', { nullable: true }) locale!: string | null

  @Column('bool', { default: true }) enabled!: boolean
  @Column('timestamptz', { nullable: true }) disabledAt!: Date | null

  @CreateDateColumn() createdAt!: Date
  @UpdateDateColumn() updatedAt!: Date
}