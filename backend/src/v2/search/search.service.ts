import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TrackSearchDto } from './dto/track-search.dto';
import { SearchLogEntity } from '../../search/search-log.entity';
import { UserEntity } from '../../users/user.entity';

@Injectable()
export class SearchV2Service {
  constructor(
    @InjectRepository(SearchLogEntity)
    private readonly searchLogRepo: Repository<SearchLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly ds: DataSource // Keep DS for complex queries if needed
  ) { }

  async track(companyId: string, userId: string, dto: TrackSearchDto) {
    try {
      // 1. Resolve User Segment (Department or First Group)
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'department', 'groups']
      });

      const userGroupId = user?.department || (user?.groups?.length ? user.groups[0] : null);

      // 2. Save Log
      await this.searchLogRepo.save({
        companyId,
        userId,
        query: dto.q,
        resultCount: dto.results || 0,
        userGroupId: userGroupId || undefined,
        // tookMs metadata is not in entity yet, avoiding for now
      });

      return { ok: true, stored: true };
    } catch (err) {
      console.error('Error tracking search:', err);
      return { ok: false, stored: false };
    }
  }

  async overview(companyId: string, from?: string, to?: string) {
    try {
      const qb = this.searchLogRepo.createQueryBuilder('s')
        .where('s.companyId = :companyId', { companyId });

      if (from) qb.andWhere('s.createdAt >= :from', { from });
      if (to) qb.andWhere('s.createdAt < :to', { to });

      // Aggregate Stats
      // Note: TypeORM doesn't support multiple counts in one getRawOne easily without selecting raw
      const rawStats = await qb
        .select('COUNT(*)', 'totalSearches')
        .addSelect('COUNT(DISTINCT s.userId)', 'uniqueUsers')
        .getRawOne();

      // Top Queries
      const topQueries = await qb
        .select('s.query', 'q')
        .addSelect('COUNT(*)', 'count')
        .groupBy('s.query')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      // Zero Result Queries (New Feature!)
      const zeroResultQueries = await this.searchLogRepo.createQueryBuilder('s')
        .select('s.query', 'q')
        .addSelect('COUNT(*)', 'count')
        .where('s.companyId = :companyId', { companyId })
        .andWhere('s.resultCount = 0')
        .groupBy('s.query')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        from: from ?? null,
        to: to ?? null,
        totalSearches: Number(rawStats?.totalSearches || 0),
        uniqueUsers: Number(rawStats?.uniqueUsers || 0),
        avgTookMs: 0, // Not tracked yet
        topQueries: topQueries.map(t => ({ q: t.q, count: Number(t.count) })),
        zeroResultQueries: zeroResultQueries.map(t => ({ q: t.q, count: Number(t.count) }))
      };
    } catch (err) {
      console.error('Error getting search overview:', err);
      return {
        from, to,
        totalSearches: 0,
        uniqueUsers: 0,
        topQueries: [],
        zeroResultQueries: []
      };
    }
  }
}
