import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserXPHistoryEntity } from './entities/user-xp-history.entity';
import { UserEntity } from '../../users/user.entity';
import { GamificationService } from './gamification.service';
import {
    GamificationAnalyticsOverview,
    GamificationRankingUser,
    GamificationHeatmapDay,
    GamificationActionTypeDistribution,
    UserXPHistoryItem,
} from './dto/analytics.dto';

@Injectable()
export class GamificationAnalyticsService {
    constructor(
        @InjectRepository(UserXPHistoryEntity)
        private readonly historyRepo: Repository<UserXPHistoryEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService,
    ) { }

    async getOverview(companyId: string): Promise<GamificationAnalyticsOverview> {
        // Total XP distributed
        const totalResult = await this.historyRepo
            .createQueryBuilder('h')
            .innerJoin('user_entity', 'u', 'u.id = h.userId')
            .select('COALESCE(SUM(h.amount), 0)', 'total')
            .where('u.companyId = :companyId', { companyId })
            .getRawOne();

        const totalXPDistributed = parseInt(totalResult?.total || '0');

        // Active users (gained XP in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeResult = await this.historyRepo
            .createQueryBuilder('h')
            .innerJoin('user_entity', 'u', 'u.id = h.userId')
            .select('COUNT(DISTINCT h.userId)', 'count')
            .where('u.companyId = :companyId', { companyId })
            .andWhere('h.createdAt >= :from', { from: thirtyDaysAgo })
            .getRawOne();

        const activeUsers = parseInt(activeResult?.count || '0');

        // Total actions
        const actionsResult = await this.historyRepo
            .createQueryBuilder('h')
            .innerJoin('user_entity', 'u', 'u.id = h.userId')
            .select('COUNT(*)', 'count')
            .where('u.companyId = :companyId', { companyId })
            .getRawOne();

        const totalActions = parseInt(actionsResult?.count || '0');

        // Average XP per user - count users with any XP
        const usersWithXPQuery = await this.userRepo
            .createQueryBuilder('u')
            .select('COUNT(*)', 'count')
            .where('u.companyId = :companyId', { companyId })
            .andWhere('u.xp > 0')
            .getRawOne();

        const usersWithXP = parseInt(usersWithXPQuery?.count || '0');
        const averageXPPerUser = usersWithXP > 0 ? Math.round(totalXPDistributed / usersWithXP) : 0;

        return {
            totalXPDistributed,
            activeUsers,
            averageXPPerUser,
            totalActions,
        };
    }

    async getRanking(companyId: string, limit = 10): Promise<GamificationRankingUser[]> {
        const users = await this.userRepo.find({
            where: { companyId },
            order: { xp: 'DESC' },
            take: limit,
            select: ['id', 'name', 'displayName', 'avatarUrl', 'xp'],
        });

        return users.map(u => ({
            userId: u.id,
            name: u.name,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            xp: u.xp,
            level: this.gamificationService.getLevelFromXP(u.xp),
        }));
    }

    async getHeatmap(companyId: string, from: Date, to: Date): Promise<GamificationHeatmapDay[]> {
        const results = await this.historyRepo
            .createQueryBuilder('h')
            .innerJoin('user_entity', 'u', 'u.id = h.userId')
            .select('DATE(h.createdAt)', 'date')
            .addSelect('COALESCE(SUM(h.amount), 0)', 'xp')
            .addSelect('COUNT(*)', 'actions')
            .where('u.companyId = :companyId', { companyId })
            .andWhere('h.createdAt >= :from', { from })
            .andWhere('h.createdAt <= :to', { to })
            .groupBy('DATE(h.createdAt)')
            .orderBy('DATE(h.createdAt)', 'ASC')
            .getRawMany();

        return results.map(r => ({
            date: r.date,
            xp: parseInt(r.xp),
            actions: parseInt(r.actions),
        }));
    }

    async getByActionType(companyId: string, from?: Date, to?: Date): Promise<GamificationActionTypeDistribution[]> {
        let query = this.historyRepo
            .createQueryBuilder('h')
            .innerJoin('user_entity', 'u', 'u.id = h.userId')
            .select('h.actionType', 'actionType')
            .addSelect('COALESCE(SUM(h.amount), 0)', 'xp')
            .addSelect('COUNT(*)', 'count')
            .where('u.companyId = :companyId', { companyId });

        if (from) {
            query = query.andWhere('h.createdAt >= :from', { from });
        }
        if (to) {
            query = query.andWhere('h.createdAt <= :to', { to });
        }

        const results = await query
            .groupBy('h.actionType')
            .orderBy('xp', 'DESC')
            .getRawMany();

        const total = results.reduce((sum, r) => sum + parseInt(r.xp), 0);

        return results.map(r => ({
            actionType: r.actionType,
            xp: parseInt(r.xp),
            count: parseInt(r.count),
            percentage: total > 0 ? Math.round((parseInt(r.xp) / total) * 100) : 0,
        }));
    }

    async getUserHistory(userId: string, limit = 50): Promise<UserXPHistoryItem[]> {
        const history = await this.historyRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            select: ['id', 'amount', 'actionType', 'description', 'createdAt'],
        });

        return history.map(h => ({
            id: h.id,
            amount: h.amount,
            actionType: h.actionType,
            description: h.description || '',
            createdAt: h.createdAt,
        }));
    }
}
