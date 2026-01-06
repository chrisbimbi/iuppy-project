import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('nr1_versions')
@Index(['company_id', 'space_id'])
export class Nr1Version {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    company_id: string;

    @Column('uuid', { nullable: true })
    space_id: string; // If versioning per unit/space

    @Column('text')
    snapshot_url: string; // URL to stored JSON/PDF snapshot in Storage/S3

    @Column('bool', { default: false })
    assinado_icp: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
