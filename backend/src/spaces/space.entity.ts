import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Space } from '@shared/types/Space';

@Entity({ name: 'spaces' })  // O nome da tabela será "spaces"
export class SpaceEntity implements Space {
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'int', nullable: true })
  priority?: number;

  @Column({ default: true })
  active?: boolean;
}