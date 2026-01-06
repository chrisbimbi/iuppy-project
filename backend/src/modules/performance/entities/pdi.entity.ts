import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PDI, PDIStatus } from '@shared/types';
import { UserEntity } from '../../../users/user.entity';

@Entity('pdis')
@Index(['userId'])
export class PDIEntity implements PDI {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    userId!: string;

    @Column()
    title!: string;

    @Column({
        type: 'enum',
        enum: PDIStatus,
        default: PDIStatus.NOT_STARTED,
    })
    status!: PDIStatus;

    @Column({ type: 'timestamptz' })
    deadline!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user?: UserEntity;
}
