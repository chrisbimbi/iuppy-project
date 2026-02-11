import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IntegrationConnection } from './integration_connection.entity';

@Entity('integration_configs')
export class IntegrationConfigEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'connection_id' })
    connectionId: string;

    @OneToOne(() => IntegrationConnection)
    @JoinColumn({ name: 'connection_id' })
    connection: IntegrationConnection;

    // The core "De-Para" mapping logic
    // Structure: { "sourceField": "destinationInfo" }
    // Example: 
    // {
    //   "jobTitle": { "target": "role", "map": { "Manager": "Gestor", "Dev": "Colaborador" } },
    //   "department": { "target": "group", "prefix": "Dept - " }
    // }
    @Column({ type: 'jsonb', default: {} })
    fieldMapping: Record<string, any>;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
