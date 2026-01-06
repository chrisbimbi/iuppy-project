import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from '../../users/user.entity';
import { NewsReactionEntity } from '../interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from '../interactions/entities/news-comment.entity';
import { NewsShareEntity } from '../interactions/entities/news-share.entity';

@Injectable()
export class UserAnalyticsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NewsReactionEntity)
    private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity)
    private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity)
    private readonly shareRepo: Repository<NewsShareEntity>,
    private readonly ds: DataSource,
  ) { }

  async getOverview(companyId: string) {
    // 1. User Counts
    const totalUsers = await this.userRepo.count({ where: { companyId } });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Registered: Users with password (assuming all for now, or check password hash)
    const registeredUsers = await this.userRepo.count({ where: { companyId } });

    // Active: Logged in last 30 days
    const activeUsers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.companyId = :companyId', { companyId })
      .andWhere('u.lastLoginAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    // Engaged: Performed an interaction in last 30 days
    // We check InteractionEventEntity for this
    const engagedUsersResult = await this.ds.query(
      `SELECT COUNT(DISTINCT "userId")::int as c FROM news_interaction_event 
       WHERE "companyId"=$1 AND "createdAt" >= $2`,
      [companyId, thirtyDaysAgo],
    );
    const engagedUsers = Number(engagedUsersResult?.[0]?.c || 0);

    // Rates
    const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const engagedRate = totalUsers > 0 ? (engagedUsers / totalUsers) * 100 : 0;

    // 2. Activity Series (Daily for last 30 days)
    const activitySeries = await this.getActivitySeries(companyId, 30);

    // 3. Interactions Breakdown
    const interactions = await this.getInteractions(companyId);

    // 4. Heatmap
    const heatmap = await this.getHeatmap(companyId);

    return {
      users: {
        total: totalUsers,
        registered: registeredUsers,
        active: activeUsers,
        engaged: engagedUsers,
        activeRate: parseFloat(activeRate.toFixed(1)),
        engagedRate: parseFloat(engagedRate.toFixed(1)),
      },
      activitySeries,
      interactions,
      heatmap,
    };
  }

  async getActivitySeries(companyId: string, days: number) {
    const result = await this.ds.query(
      `
      WITH dates AS (
          SELECT generate_series(
            date_trunc('day', now()) - make_interval(days => $2),
            date_trunc('day', now()),
            '1 day'::interval
          ) as day
      )
      SELECT 
        to_char(d.day, 'YYYY-MM-DD') as date,
        (SELECT COUNT(DISTINCT "userId") FROM news_interaction_event WHERE "companyId"=$1 AND date_trunc('day', "createdAt") = d.day) as engaged,
        (SELECT COUNT(*) FROM user_entity WHERE "companyId"=$1 AND date_trunc('day', "lastLoginAt") = d.day) as active
      FROM dates d
      ORDER BY d.day ASC
      `,
      [companyId, days],
    );
    return result.map((r: any) => ({
      date: r.date,
      active: Number(r.active),
      engaged: Number(r.engaged),
    }));
  }

  async getInteractions(companyId: string) {
    const result = await this.ds.query(
      `SELECT type, COUNT(*)::int as c FROM news_interaction_event 
       WHERE "companyId"=$1 AND type IN ('REACTION', 'COMMENT', 'SHARE', 'FAVORITE')
       GROUP BY type`,
      [companyId],
    );

    const map: any = { REACTION: 0, COMMENT: 0, SHARE: 0, FAVORITE: 0 };
    result.forEach((r: any) => {
      map[r.type] = Number(r.c);
    });

    return {
      likes: map.REACTION,
      comments: map.COMMENT,
      shares: map.SHARE,
      favorites: map.FAVORITE,
    };
  }

  async getHeatmap(companyId: string) {
    // DOW: 0=Sun, 6=Sat
    // Hour: 0-23
    const result = await this.ds.query(
      `SELECT 
         EXTRACT(DOW FROM "createdAt")::int as dow,
         EXTRACT(HOUR FROM "createdAt")::int as hour,
         COUNT(DISTINCT "userId")::int as count
       FROM news_interaction_event
       WHERE "companyId"=$1
       GROUP BY 1, 2`,
      [companyId],
    );
    return result;
  }

  async exportTimeSeries(companyId: string) {
    const series = await this.getActivitySeries(companyId, 365); // 1 year
    const header = 'Date,Active Users,Engaged Users\n';
    const rows = series
      .map((s: any) => `${s.date},${s.active},${s.engaged}`)
      .join('\n');
    return header + rows;
  }
}
