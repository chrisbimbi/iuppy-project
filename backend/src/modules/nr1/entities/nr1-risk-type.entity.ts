
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('nr1_risk_types')
export class Nr1RiskType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'company_id' })
    @Index()
    company_id: string;

    @Column()
    name: string; // e.g. "Físico", "Psicossocial"

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true }) // e.g. "#FF0000"
    color: string;

    @Column({ nullable: true }) // e.g. "ri-mental-health-line"
    icon: string;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
