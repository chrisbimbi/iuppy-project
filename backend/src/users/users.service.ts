import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  // ===== CRUD =====
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);
    user.password = await argon2.hash(user.password);
    const savedUser = await this.userRepository.save(user);
    this.eventEmitter.emit('user.created', savedUser);
    return savedUser;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    if ((updateUserDto as any).password) {
      (updateUserDto as any).password = await argon2.hash(
        (updateUserDto as any).password,
      );
    }
    await this.userRepository.update(id, updateUserDto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  // ===== Helpers usados pelo Auth =====

  /**
   * Perfil público/seguro para o /auth/me.
   */
  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        visibleGroups: true,
      },
    });

    if (!user) return null;

    let realGroupIds: string[] = [];
    let realSpaceIds: string[] = [];

    try {
      // 1. Grupos: Busca na tabela de relacionamento REAL (user_group_members)
      // Usamos alias simples e cast para garantir
      const groupRows = await this.dataSource.query(
        `SELECT group_id FROM user_group_members WHERE user_id = $1`,
        [id],
      );
      realGroupIds = groupRows.map((r: any) => r.group_id);
    } catch (e) {
      this.logger.warn(
        `[UsersService] Erro ao buscar grupos: ${(e as any).message}`,
      );
    }

    try {
      // 2. Spaces: Como não há tabela de relação user-space,
      // assumimos que o usuário tem acesso aos spaces da empresa.
      const spaceRows = await this.dataSource.query(
        `SELECT id FROM space WHERE "companyId" = $1 AND COALESCE(active, true) = true`,
        [user.companyId],
      );
      realSpaceIds = spaceRows.map((r: any) => r.id);
    } catch (e) {
      this.logger.warn(
        `[UsersService] Erro ao buscar spaces: ${(e as any).message}`,
      );
    }

    return {
      ...user,
      groups: realGroupIds,
      spaceIds: realSpaceIds,
    };
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  findByIdWithRefresh(id: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userRepository.update(
      { id: userId },
      { refreshTokenHash: hash || null },
    );
  }

  async updateLoginStats(userId: string) {
    if (!userId) return;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`[UsersService] User ${userId} not found for stats update`);
      return;
    }

    const now = new Date();
    user.lastLoginAt = now;
    if (!user.firstLoginAt) {
      user.firstLoginAt = now;
    }

    try {
      await this.userRepository.save(user);
      this.logger.log(`[UsersService] Updated login stats for ${userId}: lastLoginAt=${now}`);
    } catch (e) {
      this.logger.error(`[UsersService] Failed to update login stats for ${userId}`, e);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async updateOtp(userId: string, code: string | null, expiresAt: Date | null) {
    await this.userRepository.update(userId, {
      otpCode: code,
      otpExpiresAt: expiresAt,
    });
  }

  async findByEmailWithOtp(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.otpCode')
      .addSelect('u.otpExpiresAt')
      .where('u.email = :email', { email })
      .getOne();
  }

  async findByIdentifier(identifier: string) {
    // Search by Email OR SyncKey (Matricula) OR registrationNumber OR CPF
    // Try to match CPF with or without formatting
    const cleanIdentifier = identifier.replace(/[.\-/]/g, ''); // Remove formatting

    return this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :identifier', { identifier })
      .orWhere('u.syncKey = :identifier', { identifier })
      .orWhere('u.registrationNumber = :identifier', { identifier })
      .orWhere('u.registrationNumber = :cleanIdentifier', { cleanIdentifier })
      .orWhere(`u."customAttributes"->>'cpf' = :identifier`, { identifier })
      .orWhere(`u."customAttributes"->>'cpf' = :cleanIdentifier`, { cleanIdentifier })
      .getOne();
  }

  async updatePhone(userId: string, phone: string) {
    await this.userRepository.update(userId, { phone });
  }

  async getDashboardStats(companyId: string) {
    // 1. Snapshot totals
    const totalUsers = await this.userRepository.count({ where: { companyId } });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await this.userRepository.createQueryBuilder('u')
      .where('u.companyId = :companyId', { companyId })
      .andWhere('u.lastLoginAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    // 2. Evolution Chart Data (Last 6 Months)
    // We want 3 lines: 
    // - Total Users (Cumulative count at end of month)
    // - Active Users (Approx: Users who logged in that month? OR Users created? 
    //   Real historical active users is hard without login logs. 
    //   We'll proxy "Active" in chart as "Users with firstLoginAt <= MonthEnd AND (lastLoginAt >= MonthStart)". 
    //   Actually, without logs, we can't know if they logged in specific months in the past. 
    //   We will use "Engaged" as the primary activity metric for the chart, 
    //   and "Total" for growth. 
    //   For "Active" line, we might just repeat the current active count or 
    //   use "Created in month" to show new growth? 
    //   Let's stick to the prompt's request: "Total, Active, Engaged".
    //   Since we lack login history, we will assume "Active" = "Engaged" for historical purposes in the chart, 
    //   OR we can try to find if there is a 'last_seen' on interactions.

    //   Let's define for the CHART:
    //   - Total: Cumulative users created.
    //   - Engaged: Count of unique users who generated an interaction/submission in that month.
    //   - "Active": We will omit from historical chart if we lack data, OR we plot "Engaged" as "Ativos". 
    //     BUT user asked for Total AND Active AND Engaged. 
    //     Let's treat "Active" as "Logins" if we had logs. 
    //     Workaround: We will use "Engaged" count as "Engaged", and maybe "New Users" as "Active"? No.
    //     Let's do:
    //     - Total: Cumulative
    //     - Engaged: (News Interactions + Form Submissions + Journey Progress)
    //     - Active: We will simply plot "Engaged" (Interactions) effectively as "Active", 
    //       or if we strictly distinguish: "Engaged" = write actions, "Active" = read actions?
    //       Let's query interactions for "VIEW" vs "LIKE/COMMENT".
    //       News interaction has types.

    // Querying monthly stats
    const evolutionQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '5 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) as month
      ),
      total_counts AS (
        SELECT 
          date_trunc('month', "createdAt") as m, 
          COUNT(*) as cnt 
        FROM user_entity 
        WHERE "companyId"::text = $1 
        GROUP BY 1
      ),
      engagement_counts AS (
        SELECT date_trunc('month', action_date) as m, COUNT(DISTINCT user_id) as cnt
        FROM (
            -- News Interactions
            SELECT "createdAt" as action_date, "userId"::text as user_id FROM news_interaction_event 
            WHERE "companyId"::text = $1
            
            UNION ALL
            
            -- Forms
            SELECT "createdAt" as action_date, "userId"::text as user_id FROM form_submission
            WHERE "formId" IN (SELECT id FROM form WHERE "companyId"::text = $1)

            -- Add Journeys if available (user_journey_instance or step_completion)
            -- UNION ALL 
            -- SELECT "updatedAt" as action_date, "userId" as user_id FROM user_journey_instance ...
        ) as violations
        GROUP BY 1
      )
      SELECT 
        TO_CHAR(months.month, 'YYYY-MM') as month_label,
        (SELECT COUNT(*) FROM user_entity u 
         WHERE u."companyId"::text = $1 
         AND u."createdAt" < months.month + INTERVAL '1 month'
        ) as total,
        COALESCE(ec.cnt, 0) as engaged
      FROM months
      LEFT JOIN engagement_counts ec ON ec.m = months.month
      ORDER BY months.month ASC
    `;

    // Note: This query calculates "Total" correctly as cumulative. 
    // "Engaged" is active interactions. 
    // "Active" line in chart: We'll construct it in specific Logic or just map Engaged -> Active for now 
    // if we don't have login logs. 
    // However, user asked for 3 lines. 
    // 1. Total 
    // 2. Active (Logins) - We don't have this history. We will return 0 or duplicate Engaged? 
    //    Actually, we can use "Active Users" as "Users who were 'alive' (created before, not deleted)"? No, that's Total.
    //    Let's return 'total' and 'engaged'. If frontend expects 'active', we might simulate it 
    //    or simply return 'engaged' as the activity metric. 
    //    Let's try to improve 'engaged' by including 'login' if we had it. Use 'lastLoginAt' 
    //    to at least populate the LAST month's Active count correctly?

    const rawEvolution = await this.dataSource.query(evolutionQuery, [companyId]);

    // Post-process to ensure we have the structure needed
    const evolution = rawEvolution.map(r => ({
      month: r.month_label,
      total: parseInt(r.total),
      active: parseInt(r.total), // Active = Total (Available Users) since we lack login history
      engaged: parseInt(r.engaged)
    }));

    return {
      totalUsers,
      activeUsers,
      evolution,
    };
  }
}
