import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('push_delivery')
@Index(['companyId', 'newsId'])
@Index(['userId'])
@Index(['status'])
export class PushDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  newsId: string;

  @Column('uuid')
  userId: string;

  // queued | sent | delivered | error
  @Column('text')
  status: string;

  @Column('text', { nullable: true })
  provider: string | null;

  @Column('text', { nullable: true })
  providerId: string | null;

  @Column('text', { nullable: true })
  errorCode: string | null;

  @Column('timestamptz', { default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { nullable: true })
  deliveredAt: Date | null;
}