import { Role } from '@shared/src/types';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.EMPLOYEE
  })
  role: Role;

  @Column()
  department: string;

  @Column()
  position: string;

  @Column()
  hireDate: Date;

  @Column()
  isActive: boolean;

  @Column({ nullable: true })
  lastLogin: Date;
}