import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VacationRequestEntity } from './vacation-request.entity';

@Entity('collective_vacations')
export class CollectiveVacationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column()
    title: string;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    targetFilters: {
        departments?: string[];
        groups?: string[];
        userIds?: string[];
    };

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => VacationRequestEntity, (request) => request.collectiveVacation)
    requests: VacationRequestEntity[];
}
