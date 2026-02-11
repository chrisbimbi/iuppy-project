import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AudienceMode } from '@shared/types/NewsSettings';
import { UserDeviceEntity } from '../notifications/entities/user-device.entity';
import { CompanyEntity } from '../companies/company.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { UserSpaceEntity } from '../spaces/user-space.entity';
import { Channel } from '../channels/channel.entity';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';
import { NewsEntity } from './news.entity';
import { AudienceSelectionDto } from './dto/audience-selection.dto';
import { LogicalAudienceService } from '../v2/audience/logical-audience.service';
import { LogicalRuleDto } from '../v2/audience/dto/logical-audience.dto';

@Injectable()
export class AudienceResolverService {
  constructor(
    @InjectRepository(UserDeviceEntity)
    private readonly userDeviceRepo: Repository<UserDeviceEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepo: Repository<SpaceEntity>,
    @InjectRepository(UserSpaceEntity)
    private readonly userSpaceRepo: Repository<UserSpaceEntity>,
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    private readonly logicalService: LogicalAudienceService,
  ) { }

  // ---------- helpers ----------
  private toIdArray(v: any): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean).map(String);
    return [String(v)];
  }
  private uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
  }

  private getChannelGroupIds(ch: any): string[] {
    return this.toIdArray(ch?.groupIds ?? ch?.group_ids);
  }
  private getChannelSpaceIds(ch: any): string[] {
    const arr = this.toIdArray(ch?.spaceIds ?? ch?.space_ids);
    if (arr.length) return arr;
    return this.toIdArray(ch?.spaceId ?? ch?.space_id);
  }
  private getSpaceTargetGroups(sp: any): string[] {
    return this.toIdArray(sp?.targetGroupIds ?? sp?.target_group_ids);
  }
  private getChannelContributorIds(ch: any): string[] {
    return this.toIdArray(ch?.contributorIds ?? ch?.contributor_ids);
  }
  private getChannelAdminIds(ch: any): string[] {
    return this.toIdArray(ch?.adminIds ?? ch?.admin_ids);
  }

  /** Conta usuários com device ativo evitando IN() vazio e cobrindo devices antigos com companyId NULL. */
  private async countUsersWithActiveToken(
    companyId: string,
    userIds: string[],
  ): Promise<number> {
    const ids = this.toIdArray(userIds);
    if (ids.length === 0) return 0;
    const sql = `
      SELECT DISTINCT device."userId"
        FROM "user_device" device
       WHERE device."enabled" = TRUE
         AND device."userId" = ANY($1::uuid[])
         AND (device."companyId" = $2 OR device."companyId" IS NULL)
    `;
    const rows = await this.userDeviceRepo.manager.query(sql, [ids, companyId]);
    return (rows ?? []).length;
  }

  // ---------- resolve ----------
  async resolve(
    companyId: string,
    mode: AudienceMode,
    params: Record<string, any>,
  ): Promise<string[]> {
    if (!companyId) throw new BadRequestException('companyId é obrigatório');

    let userIds: string[] = [];

    switch (mode) {
      case AudienceMode.COMPANY: {
        // ... (keep existing)
        const users = await this.userRepo.find({
          where: { companyId, isActive: true },
          select: ['id'],
        });
        userIds = users.map((u) => String(u.id));
        break;
      }

      case AudienceMode.SPACE: {
        // ... (keep existing)
        const spaceId = params?.spaceId;
        if (!spaceId)
          throw new BadRequestException('spaceId é obrigatório para SPACE');

        const space = await this.spaceRepo.findOne({
          where: { id: String(spaceId), companyId },
        });
        if (!space) return [];

        const targetGroupIds = this.getSpaceTargetGroups(space);

        // 1. Direct Members
        const members = await this.userSpaceRepo.find({
          where: { spaceId: String(spaceId) },
        });
        members.forEach((m) => userIds.push(m.userId));

        // 2. Group Members
        if (targetGroupIds.length > 0) {
          const groups = await this.groupRepo.find({
            where: { id: In(targetGroupIds), companyId },
            relations: ['members'],
          });
          groups.forEach((g) =>
            userIds.push(...(g.members ?? []).map((m) => String(m.id))),
          );
        }

        // 3. Fallback to All Users (Only if NO groups AND NO direct members are configured)
        if (userIds.length === 0 && targetGroupIds.length === 0 && members.length === 0) {
          const users = await this.userRepo.find({
            where: { companyId, isActive: true },
            select: ['id'],
          });
          userIds = users.map((u) => String(u.id));
        }
        break;
      }

      case AudienceMode.CHANNEL: {
        // ... (keep existing)
        const channelIds = this.toIdArray(params?.channelIds);
        if (channelIds.length === 0)
          throw new BadRequestException(
            'channelIds é obrigatório para CHANNEL',
          );

        const channels = await this.channelRepo.find({
          where: { id: In(channelIds), companyId },
        });
        for (const ch of channels) {
          const chGroupIds = this.getChannelGroupIds(ch);
          if (chGroupIds.length > 0) {
            const groups = await this.groupRepo.find({
              where: { id: In(chGroupIds), companyId },
              relations: ['members'],
            });
            groups.forEach((g) =>
              userIds.push(...(g.members ?? []).map((m) => String(m.id))),
            );
          }

          const spaceIds = this.getChannelSpaceIds(ch);
          if (spaceIds.length > 0) {
            const spaces = await this.spaceRepo.find({
              where: { id: In(spaceIds), companyId },
            });
            for (const sp of spaces) {
              const tg = this.getSpaceTargetGroups(sp);
              if (tg.length > 0) {
                const gs = await this.groupRepo.find({
                  where: { id: In(tg), companyId },
                  relations: ['members'],
                });
                gs.forEach((g) =>
                  userIds.push(...(g.members ?? []).map((m) => String(m.id))),
                );
              }
            }
          }

          userIds.push(...this.getChannelAdminIds(ch));
          userIds.push(...this.getChannelContributorIds(ch));
        }

        if (userIds.length === 0) {
          const users = await this.userRepo.find({
            where: { companyId, isActive: true },
            select: ['id'],
          });
          userIds = users.map((u) => String(u.id));
        }
        break;
      }

      case AudienceMode.GROUPS: {
        // ... (keep existing)
        const groupIds = this.toIdArray(
          params?.groupIds ??
          params?.audienceGroupIds ??
          params?.targetAudience,
        );
        if (groupIds.length === 0)
          throw new BadRequestException('groupIds é obrigatório para GROUPS');

        const groups = await this.groupRepo.find({
          where: { id: In(groupIds), companyId },
          relations: ['members'],
        });
        groups.forEach((g) =>
          userIds.push(...(g.members ?? []).map((m) => String(m.id))),
        );
        break;
      }

      case AudienceMode.LOGICAL: {
        const rule = params?.logicalRule as LogicalRuleDto;
        if (!rule)
          throw new BadRequestException(
            'logicalRule é obrigatório para LOGICAL',
          );
        userIds = await this.logicalService.resolveUserIds(companyId, rule);
        break;
      }

      default:
        throw new BadRequestException(`Audience mode não suportado: ${mode}`);
    }

    return this.uniq(userIds.map(String));
  }

  // ---------- probe ----------
  async probe(
    companyId: string,
    mode: AudienceMode,
    params: Record<string, any>,
  ): Promise<{
    totalUsuarios: number;
    comTokenAtivo: number;
    mode: AudienceMode;
    identifiers: Record<string, any>;
  }> {
    if (!companyId) throw new BadRequestException('companyId é obrigatório');

    const eligibleUserIds = await this.resolve(companyId, mode, params);
    const comTokenAtivo =
      eligibleUserIds.length === 0
        ? 0
        : await this.countUsersWithActiveToken(companyId, eligibleUserIds);

    const identifiers: Record<string, any> = {
      spaceId: params?.spaceId ?? params?.audienceSpaceId ?? null,
      channelIds: params?.channelIds ?? params?.audienceChannelIds ?? [],
      groupIds:
        params?.groupIds ??
        params?.audienceGroupIds ??
        params?.targetAudience ??
        [],
      logicalRule: params?.logicalRule ?? null,
    };

    return {
      totalUsuarios: eligibleUserIds.length,
      comTokenAtivo,
      mode,
      identifiers,
    };
  }

  // ---------- apply ----------
  async applySelectionToNews(
    companyId: string,
    newsId: string,
    selection: AudienceSelectionDto,
  ) {
    if (!companyId) throw new BadRequestException('companyId é obrigatório');
    if (!newsId) throw new BadRequestException('newsId é obrigatório');

    let params: Record<string, any> = {};
    switch (selection.mode) {
      case AudienceMode.COMPANY:
        params = {};
        break;
      case AudienceMode.SPACE:
        if (!selection.spaceId)
          throw new BadRequestException('spaceId é obrigatório para SPACE');
        params = { spaceId: selection.spaceId };
        break;
      case AudienceMode.CHANNEL: {
        const ch = this.toIdArray(selection.channelIds);
        if (ch.length === 0)
          throw new BadRequestException(
            'channelIds é obrigatório para CHANNEL',
          );
        params = { channelIds: ch };
        break;
      }
      case AudienceMode.GROUPS: {
        const gs = this.toIdArray(selection.groupIds);
        if (gs.length === 0)
          throw new BadRequestException('groupIds é obrigatório para GROUPS');
        params = { groupIds: gs };
        break;
      }
      case AudienceMode.LOGICAL: {
        // Assuming selection DTO has logicalRule field (need to update DTO)
        const rule = (selection as any).logicalRule;
        if (!rule)
          throw new BadRequestException(
            'logicalRule é obrigatório para LOGICAL',
          );
        params = { logicalRule: rule };
        break;
      }
      default:
        throw new BadRequestException(
          `Audience mode não suportado: ${selection.mode}`,
        );
    }

    const resolvedUserIds = await this.resolve(
      companyId,
      selection.mode,
      params,
    );

    await this.newsRepo.manager.query(
      `DELETE FROM news_audience WHERE "companyId" = $1 AND "newsId" = $2`,
      [companyId, newsId],
    );

    if (resolvedUserIds.length > 0) {
      await this.newsRepo.manager.query(
        `
        INSERT INTO news_audience ("companyId","newsId","userId")
        SELECT $1, $2, unnest($3::uuid[])
        ON CONFLICT DO NOTHING
        `,
        [companyId, newsId, resolvedUserIds],
      );
    }

    const identifiers: Record<string, any> = {};
    if (selection.mode === AudienceMode.GROUPS)
      identifiers.groupIds = this.toIdArray(selection.groupIds);
    if (selection.mode === AudienceMode.CHANNEL)
      identifiers.channelIds = this.toIdArray(selection.channelIds);
    if (selection.mode === AudienceMode.SPACE)
      identifiers.spaceId = selection.spaceId;
    if (selection.mode === AudienceMode.LOGICAL)
      identifiers.logicalRule = (selection as any).logicalRule;

    const snapshot = {
      totalUsuarios: resolvedUserIds.length,
      mode: selection.mode,
      identifiers,
    };

    await this.newsRepo.update(
      { id: newsId as any, companyId },
      { audienceSnapshotAtPublish: snapshot as any },
    );

    return { total: resolvedUserIds.length };
  }
}
