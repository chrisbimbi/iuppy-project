import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Nr1EmergencyProcedure } from './nr1-emergency-procedure.entity';
import { Nr1DrillAttendance } from './nr1-drill-attendance.entity';

@Entity('nr1_emergency_drills')
export class Nr1EmergencyDrill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index() // often query drills by company? or via procedure
    company_id: string;

    @Column('uuid')
    procedure_id: string;

    @ManyToOne(() => Nr1EmergencyProcedure)
    @JoinColumn({ name: 'procedure_id' })
    procedure: Nr1EmergencyProcedure;

    @OneToMany(() => Nr1DrillAttendance, attendance => attendance.drill)
    attendances: Nr1DrillAttendance[];

    @Column({ type: 'timestamptz' })
    @Index()
    data_agendada: Date;

    @Column('text')
    local: string;

    @Column('jsonb', { nullable: true })
    checklist: any;

    @Column('text', { nullable: true })
    relatorio: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
