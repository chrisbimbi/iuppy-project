import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('search_log')
export class SearchLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column()
    userId: string;

    @Column()
    query: string;

    @Column({ type: 'int', default: 0 })
    resultCount: number;

    @CreateDateColumn()
    createdAt: Date;
}
