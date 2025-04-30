import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { GroupType } from '@shared/constants/GroupType';

@Entity('user_group')
@Index(['companyId', 'identifier'], { unique: true })
export class GroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  identifier?: string;

  @Column({
    type: 'enum',
    enum: GroupType,
  })
  type: GroupType;

  @Column('simple-array', { nullable: true })
  conditions?: string[];

  @Column('simple-array', { default: '' })
  adminIds: string[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}