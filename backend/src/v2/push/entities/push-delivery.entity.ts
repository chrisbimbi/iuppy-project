import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('push_delivery')
@Index(['companyId', 'newsId'])
@Index(['companyId', 'userId'])
export class PushDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Deixe nullable para não forçar ADD NOT NULL em tabelas já populadas
  @Column('uuid', { nullable: true })
  companyId!: string | null;

  @Column('uuid', { nullable: true })
  newsId!: string | null;

  @Column('uuid', { nullable: true })
  userId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  // Colunas legadas que seus logs mostram existir — ficam todas nullable
  @Column({ type: 'timestamptz', nullable: true })
  updatedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  status?: string | null;

  @Column({ type: 'varchar', nullable: true })
  provider?: string | null;

  @Column({ type: 'varchar', nullable: true })
  channel?: string | null;

  @Column({ type: 'text', nullable: true })
  token?: string | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'text', nullable: true })
  messageId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, any>;
}
