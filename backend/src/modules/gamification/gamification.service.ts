import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserEntity } from '../../users/user.entity';
import {
    UserXPHistoryEntity,
    GamificationActionType,
} from './entities/user-xp-history.entity';
import { BadgeEntity, BadgeRuleType } from './entities/badge.entity';
import { UserBadgeEntity } from './entities/user-badge.entity';
import { CommunicationsService } from '../../notifications/communications.service';

@Injectable()
export class GamificationService {
    private readonly logger = new Logger(GamificationService.name);

    // Level thresholds (same as App)
    private readonly LEVEL_THRESHOLDS = {
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 1000,
        6: 2000,
        7: 3500,
        8: 5500,
        9: 8000,
        10: 12000,
    };

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(UserXPHistoryEntity)
        private readonly historyRepo: Repository<UserXPHistoryEntity>,
        @InjectRepository(BadgeEntity)
        private readonly badgeRepo: Repository<BadgeEntity>,
        @InjectRepository(UserBadgeEntity)
        private readonly userBadgeRepo: Repository<UserBadgeEntity>,
        private readonly dataSource: DataSource,
        private readonly eventEmitter: EventEmitter2,
        private readonly communicationsService: CommunicationsService,
    ) { }

    /**
     * Main method to award XP to a user.
     * Handles History creation, User update, and Level Up checks.
     */
    async awardXP(
        userId: string,
        amount: number,
        actionType: GamificationActionType,
        sourceId?: string,
        description?: string,
        metadata?: any,
        dailyLimit?: number,
    ) {
        if (amount <= 0) return;

        // Check Daily Limit
        if (dailyLimit && dailyLimit > 0) {
            const allowed = await this.checkDailyLimit(userId, actionType, dailyLimit);
            if (!allowed) {
                this.logger.debug(`Daily limit reached for User ${userId} Action ${actionType}. Max: ${dailyLimit}`);
                return;
            }
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Fetch User (with lock to prevent race conditions on concurrent XP awards)
            const user = await queryRunner.manager.findOne(UserEntity, {
                where: { id: userId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!user) {
                throw new Error('User not found');
            }

            const oldLevel = this.getLevelFromXP(user.xp);
            const newXP = user.xp + amount;
            const newLevel = this.getLevelFromXP(newXP);

            // 2. Update User XP
            user.xp = newXP;
            await queryRunner.manager.save(user);

            // 3. Create History Record
            const history = queryRunner.manager.create(UserXPHistoryEntity, {
                userId,
                amount,
                actionType,
                sourceId,
                description,
                metadata,
            });
            await queryRunner.manager.save(history);

            await queryRunner.commitTransaction();

            // 4. Post-Transaction Events
            this.logger.log(`Awarded ${amount} XP to user ${userId} for ${actionType}. Total: ${newXP}`);

            // Check Level Up
            if (newLevel > oldLevel) {
                this.handleLevelUp(user, oldLevel, newLevel);
            }

            // Check "Manual Award" Push (Special Case)
            if (actionType === GamificationActionType.MANUAL_AWARD) {
                this.sendManualAwardPush(user, amount, description || '');
            }

            // Check Badges
            this.checkAndAwardBadges(userId).catch(e => this.logger.error(`Error checking badges: ${e.message}`));

            return {
                amount,
                newUsageXP: newXP,
                leveledUp: newLevel > oldLevel,
                newLevel,
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to award XP to user ${userId}: ${err.message}`);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async checkDailyLimit(userId: string, actionType: GamificationActionType, limit: number): Promise<boolean> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const count = await this.historyRepo.count({
            where: {
                userId,
                actionType,
                createdAt: MoreThanOrEqual(startOfDay),
            },
        });
        return count < limit;
    }

    public getLevelFromXP(xp: number): number {
        let level = 1;
        for (const [lvl, threshold] of Object.entries(this.LEVEL_THRESHOLDS)) {
            if (xp >= threshold) level = Number(lvl);
            else break;
        }
        return level;
    }

    private async handleLevelUp(user: UserEntity, oldLevel: number, newLevel: number) {
        this.logger.log(`User ${user.id} leveled up! ${oldLevel} -> ${newLevel}`);

        this.eventEmitter.emit('gamification.levelup', {
            userId: user.id,
            oldLevel,
            newLevel,
            companyId: user.companyId,
        });

        // Send Push Notification for Level Up
        try {
            await this.communicationsService.sendPush({
                companyId: user.companyId,
                userIds: [user.id],
                title: 'Subiu de Nível! 🚀',
                body: `Parabéns! Você alcançou o Nível ${newLevel}!`,
                kind: 'GAMIFICATION_LEVEL_UP',
                entityId: String(newLevel),
            });
        } catch (e) {
            this.logger.error(`Failed to send LevelUp Push: ${e.message}`);
        }
    }

    private async sendManualAwardPush(user: UserEntity, amount: number, reason: string) {
        try {
            await this.communicationsService.sendPush({
                companyId: user.companyId,
                userIds: [user.id],
                title: `Oba! +${amount} XP! 🎉`,
                body: `Você recebeu pontos por: ${reason || 'Reconhecimento'}`,
                kind: 'GAMIFICATION_AWARD',
                entityId: 'manual', // or history ID?
            });
        } catch (e) {
            this.logger.error(`Failed to send ManualAward Push: ${e.message}`);
        }
    }

    // === READ METHODS ===

    async getUserStats(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'xp', 'name', 'avatarUrl'],
        });

        const xp = user?.xp || 0;
        const level = this.getLevelFromXP(xp);

        // Progress Calculation
        // @ts-ignore
        const currentThreshold = this.LEVEL_THRESHOLDS[level] || 0;
        // @ts-ignore
        const nextThreshold = this.LEVEL_THRESHOLDS[level + 1];

        let nextLevelXP = 0;
        let progress = 0.0;

        if (nextThreshold !== undefined) {
            // 'Next Level XP' usually implies 'How much more needed'.
            // App displays 'Próximo: X XP'. 
            nextLevelXP = nextThreshold - xp;
            const range = nextThreshold - currentThreshold;
            const xpInLevel = xp - currentThreshold;
            if (range > 0) {
                progress = Math.min(1.0, Math.max(0.0, xpInLevel / range));
            } else {
                progress = 1.0;
            }
        } else {
            // Max level logic
            nextLevelXP = 0;
            progress = 1.0;
        }

        return {
            totalXP: xp,  // Renamed from 'xp' to 'totalXP' for consistency if App uses it
            // Current App provider uses: stats['totalXP'] ?? stats['xp'] ?? 0 logic? 
            // My App code wrote: stats['totalXP'].
            // I'll return both or switch to 'totalXP'.
            xp: xp,
            level: level,
            nextLevelXP,
            progress,

            // Legacy/Pending
            journeyStepsCompleted: 0,
            newsRead: 0,
            surveysCompleted: 0,
        };
    }

    async getHistory(userId: string, limit = 20) {
        return this.historyRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    private getXPNeededForNextLevel(xp: number): number {
        const currentLevel = this.getLevelFromXP(xp);
        const nextLevel = currentLevel + 1;
        // @ts-ignore
        const threshold = this.LEVEL_THRESHOLDS[nextLevel.toString()];
        if (!threshold) return 0; // Max level
        return threshold - xp;
    }

    async isAlreadyAwarded(userId: string, actionType: GamificationActionType, sourceId: string): Promise<boolean> {
        if (!sourceId) return false;
        const count = await this.historyRepo.count({
            where: {
                userId,
                actionType,
                sourceId,
            }
        });
        return count > 0;
    }

    async getLeaderboard(companyId: string, limit = 10) {
        const users = await this.userRepo.find({
            where: { companyId },
            order: { xp: 'DESC' },
            take: limit,
            select: ['id', 'name', 'displayName', 'avatarUrl', 'xp', 'department', 'jobTitle'],
        });

        return users.map(u => ({
            ...u,
            level: this.getLevelFromXP(u.xp),
        }));
    }

    // === BADGE LOGIC ===
    async checkAndAwardBadges(userId: string) {
        const badges = await this.badgeRepo.find(); // Cache this in prod!
        if (!badges.length) return;

        // Get User Stats for Rules
        const newsCount = await this.historyRepo.count({
            where: { userId, actionType: GamificationActionType.NEWS_READ }
        });
        const surveyCount = await this.historyRepo.count({
            where: { userId, actionType: GamificationActionType.SURVEY_COMPLETION }
        });
        const journeyStepsCount = await this.historyRepo.count({
            where: { userId, actionType: GamificationActionType.JOURNEY_STEP }
        });
        // XP is in UserEntity, but here we can check if needed.

        // Get awarded badges to avoid dupes
        const userBadges = await this.userBadgeRepo.find({
            where: { userId },
            select: ['badgeId']
        });
        const awardedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

        for (const badge of badges) {
            if (awardedBadgeIds.has(badge.id)) continue;
            if (badge.ruleType === BadgeRuleType.MANUAL) continue;

            let qualified = false;
            switch (badge.ruleType) {
                case BadgeRuleType.NEWS_READ_COUNT:
                    qualified = newsCount >= badge.ruleValue;
                    break;
                case BadgeRuleType.SURVEY_COUNT:
                    qualified = surveyCount >= badge.ruleValue;
                    break;
                case BadgeRuleType.JOURNEY_STEP_COUNT:
                    qualified = journeyStepsCount >= badge.ruleValue;
                    break;
                // Add more cases as needed
            }

            if (qualified) {
                await this.awardBadge(userId, badge);
            }
        }
    }

    private async awardBadge(userId: string, badge: BadgeEntity) {
        try {
            const user = await this.userRepo.findOneBy({ id: userId });
            if (!user) return;

            await this.userBadgeRepo.save({
                userId,
                badgeId: badge.id,
            });

            this.logger.log(`Awarded Badge [${badge.slug}] to User [${userId}]`);

            // Push Notification
            await this.communicationsService.sendPush({
                companyId: user.companyId,
                userIds: [userId],
                title: `Nova Conquista: ${badge.name}! 🏆`,
                body: badge.description || 'Você desbloqueou uma nova medalha!',
                kind: 'GAMIFICATION_BADGE',
                entityId: badge.id,
                imageUrl: badge.iconUrl
            });
        } catch (e) {
            this.logger.error(`Failed to award badge: ${e.message}`);
        }
    }

    async getAllBadgesWithUserStatus(userId: string) {
        const allBadges = await this.badgeRepo.find({ order: { ruleValue: 'ASC' } });
        const userBadges = await this.userBadgeRepo.find({ where: { userId } });
        const earnedMap = new Map<string, Date>(userBadges.map(ub => [ub.badgeId, ub.awardedAt]));

        return allBadges.map(b => ({
            ...b,
            earned: earnedMap.has(b.id),
            earnedAt: earnedMap.get(b.id) || null,
        }));
    }
}
