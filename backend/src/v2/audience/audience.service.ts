import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserEntity } from 'src/users/user.entity';
import { Channel } from 'src/channels/channel.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { NewsEntity } from 'src/news/news.entity';
import type { AudienceProbeInput, AudienceProbeResult } from '@shared/types/v2/segmentation';

@Injectable()
export class AudienceService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(Channel) private channels: Repository<Channel>,
    @InjectRepository(SpaceEntity) private spaces: Repository<SpaceEntity>,
    @InjectRepository(NewsEntity) private news: Repository<NewsEntity>,
  ) {}

  /**
   * Calcula o conjunto elegível dado companyId + (scope ou newsId).
   * Regra:
   * - se newsId: usa channelId da news e os spaceIds do canal; se spaces do canal tiverem targetGroupIds,
   *   a audiência = união dos membros desses grupos. Se não houver grupos mapeados, cai para "todos da company".
   * - se scope explícito: spaceIds + channelIds + groupIds -> une tudo:
   *   * spaceIds: agrega targetGroupIds do espaço e resolve usuários por grupos
   *   * channelIds: agrega spaceIds do canal, depois targetGroupIds dos spaces
   *   * groupIds: inclui membros diretos
   * - fallback: todos os usuários da empresa (companyId).
   */
  async probe(input: AudienceProbeInput): Promise<AudienceProbeResult> {
    const { companyId } = input;
    let spaceIds: string[] = [];
    let groupIds: string[] = [];

    if (input.newsId) {
      const n = await this.news.findOne({ where: { id: input.newsId } });
      if (n) {
        const ch = await this.channels.findOne({ where: { id: n.channelId, companyId } });
        const sIds = ch?.spaceIds || [];
        spaceIds = Array.from(new Set([...spaceIds, ...sIds]));
      }
    }
    if (input.scope?.channelIds?.length) {
      const chs = await this.channels.find({ where: { id: In(input.scope.channelIds), companyId } });
      const allSpaceIds = chs.flatMap((c) => c.spaceIds || []);
      spaceIds = Array.from(new Set([...spaceIds, ...allSpaceIds]));
    }
    if (input.scope?.spaceIds?.length) {
      spaceIds = Array.from(new Set([...spaceIds, ...input.scope.spaceIds]));
    }
    if (input.scope?.groupIds?.length) {
      groupIds = Array.from(new Set([...groupIds, ...input.scope.groupIds]));
    }

    // coletar grupos-alvo definidos nos espaços
    if (spaceIds.length) {
      const sps = await this.spaces.find({ where: { id: In(spaceIds), companyId } });
      const fromSpaces = sps.flatMap((s) => s.targetGroupIds || []);
      if (fromSpaces.length) {
        groupIds = Array.from(new Set([...groupIds, ...fromSpaces]));
      }
    }

    let eligible: UserEntity[] = [];
    const breakdown: AudienceProbeResult['breakdown'] = {};

    if (groupIds.length) {
      // membros por grupos
      // (UserEntity.groups é array de string)
      eligible = await this.users
        .createQueryBuilder('u')
        .where('u."companyId" = :companyId', { companyId })
        .andWhere('u.groups && ARRAY[:...gids]::text[]', { gids: groupIds })
        .getMany();

      breakdown.fromGroups = {};
      for (const gid of groupIds) {
        const count = await this.users
          .createQueryBuilder('u')
          .where('u."companyId" = :companyId', { companyId })
          .andWhere('u.groups && ARRAY[:gid]::text[]', { gid })
          .getCount();
        breakdown.fromGroups[gid] = count;
      }
    }

    if (!eligible.length) {
      // fallback por spaces → se não havia targetGroupIds, o espaço não restringe;
      // então usa todos da company como fallback.
      eligible = await this.users.find({ where: { companyId } });
    }

    const userIds = eligible.map((u) => u.id);
    return {
      companyId,
      totalUsers: userIds.length,
      userIds,
      breakdown,
    };
  }
}