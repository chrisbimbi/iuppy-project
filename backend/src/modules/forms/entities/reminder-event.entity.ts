import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('reminder_event')
@Index(['companyId', 'formId'])
@Index(['companyId', 'ts'])
export class ReminderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  formId: string;

  @Column('text')
  kind: string; // D-1, D-2, ...

  @Column('text')
  type: string; // scheduled|sent|opened

  @Column('uuid', { nullable: true })
  userId: string | null;

  @Column('text', { nullable: true })
  externalEmail: string | null;

  @Column('jsonb', { nullable: true })
  meta: any | null;

  @Column('timestamptz')
  ts: Date;
}
