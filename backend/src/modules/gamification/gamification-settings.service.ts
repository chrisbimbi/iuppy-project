
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamificationSettingsEntity, GamificationRulesMap, GamificationRule } from './entities/gamification-settings.entity';
import { GamificationActionType } from './entities/user-xp-history.entity';

const DEFAULT_RULES: Partial<Record<GamificationActionType, GamificationRule>> = {
    // Journeys
    [GamificationActionType.JOURNEY_STEP]: { points: 50 },
    [GamificationActionType.JOURNEY_COMPLETION]: { points: 100 },

    // News (Comunicados)
    [GamificationActionType.NEWS_READ]: { points: 1, dailyLimit: 10 },
    [GamificationActionType.NEWS_REACTION]: { points: 2, dailyLimit: 20 },
    [GamificationActionType.NEWS_COMMENT]: { points: 3, dailyLimit: 5 },
    [GamificationActionType.NEWS_SHARE]: { points: 5, dailyLimit: 10 },

    // Social Wall (Posts)
    [GamificationActionType.SOCIAL_POST]: { points: 5, dailyLimit: 3 },
    [GamificationActionType.SOCIAL_REACTION]: { points: 2, dailyLimit: 20 },
    [GamificationActionType.SOCIAL_COMMENT]: { points: 5, dailyLimit: 5 },
    [GamificationActionType.SOCIAL_SHARE]: { points: 3, dailyLimit: 10 },

    // Others
    [GamificationActionType.SURVEY_COMPLETION]: { points: 20 },
    [GamificationActionType.AGREEMENT_ACCEPT]: { points: 30 },
};

@Injectable()
export class GamificationSettingsService {
    private readonly logger = new Logger(GamificationSettingsService.name);

    constructor(
        @InjectRepository(GamificationSettingsEntity)
        private readonly settingsRepo: Repository<GamificationSettingsEntity>,
    ) { }

    async getSettings(companyId: string): Promise<GamificationRulesMap> {
        const row = await this.settingsRepo.findOne({ where: { companyId } });
        return row?.rules || {};
    }

    async updateSettings(companyId: string, rules: GamificationRulesMap) {
        let row = await this.settingsRepo.findOne({ where: { companyId } });
        if (!row) {
            row = this.settingsRepo.create({ companyId, rules: {} });
        }
        // Merge rules? Or replace? 
        // Replace is safer for full config UI. Merge for partial updates.
        // Let's merge deeply to preserve other keys.
        row.rules = { ...row.rules, ...rules };
        return this.settingsRepo.save(row);
    }

    async resolveConfig(companyId: string, actionType: GamificationActionType, overridePoints?: number): Promise<{ points: number, dailyLimit?: number }> {
        // 1. Get Company Settings (cached ideally, but db for now)
        const companyRules = await this.getSettings(companyId);

        // 2. Get Rule or Default
        const rule = companyRules[actionType] || DEFAULT_RULES[actionType] || { points: 0 };

        // 3. Apply Override
        const points = (overridePoints !== undefined && overridePoints !== null)
            ? overridePoints
            : rule.points;

        return {
            points,
            dailyLimit: rule.dailyLimit,
        };
    }
}
