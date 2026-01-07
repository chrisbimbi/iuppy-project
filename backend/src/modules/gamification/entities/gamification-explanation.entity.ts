import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('gamification_explanation')
export class GamificationExplanationEntity {
    @PrimaryColumn() companyId: string;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
