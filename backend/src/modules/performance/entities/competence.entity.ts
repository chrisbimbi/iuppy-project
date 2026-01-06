import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Competence } from '@shared/types';

@Entity('competences')
export class CompetenceEntity implements Competence {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    category!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: string;
}
