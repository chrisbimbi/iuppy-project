import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Nr1EmergencyDrill } from './nr1-emergency-drill.entity';

@Entity('nr1_drill_attendance')
@Index(['drill_id', 'user_id'], { unique: true })
export class Nr1DrillAttendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    drill_id: string;

    @ManyToOne(() => Nr1EmergencyDrill)
    @JoinColumn({ name: 'drill_id' })
    drill: Nr1EmergencyDrill;

    @Column('uuid')
    @Index()
    user_id: string;

    @Column({ type: 'timestamptz' })
    hora_checkin: Date;

    @Column({
        type: 'enum',
        enum: ['QR', 'app', 'manual'],
        default: 'QR',
    })
    metodo: string;

    @Column('jsonb', { nullable: true })
    evidencias: any; // photo, geolocation

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
