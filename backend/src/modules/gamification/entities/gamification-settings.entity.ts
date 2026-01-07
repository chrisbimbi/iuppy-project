
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { GamificationActionType } from './user-xp-history.entity';

export interface GamificationRule {
    points: number;
    dailyLimit?: number;
    enabled?: boolean;
}

export type GamificationRulesMap = Partial<Record<GamificationActionType, GamificationRule>>;

@Entity('gamification_settings')
export class GamificationSettingsEntity {
    @PrimaryColumn('uuid')
    companyId: string;

    @Column({ type: 'jsonb', default: {} })
    rules: GamificationRulesMap;

    @UpdateDateColumn()
    updatedAt: Date;
}
