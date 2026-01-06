import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('data_lake_snapshots')
@Index(['userId', 'snapshotDate'])
export class DataLakeSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;
    // Intentionally loose coupling (no FK constraint) to keep historical data even if user is deleted/archived

    @Column({ name: 'snapshot_date', type: 'date' })
    snapshotDate: Date;

    @Column({ name: 'data_source' })
    dataSource: string; // 'adp', 'sap', 'iuppy_internal'

    @Column({ type: 'jsonb' })
    raw_data: any; // Full payload

    // Extracted features for ML (Turnover Model)
    @Column({ name: 'salary_band_hash', nullable: true })
    salaryBandHash: string; // Hashed for privacy

    @Column({ name: 'commute_distance_km', type: 'float', nullable: true })
    commuteDistanceKm: number;

    @Column({ name: 'tenure_days', type: 'int', nullable: true })
    tenureDays: number;

    @Column({ name: 'days_since_last_promotion', type: 'int', nullable: true })
    daysSinceLastPromotion: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
