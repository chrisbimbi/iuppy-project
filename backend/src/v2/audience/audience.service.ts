import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { UserEntity } from 'src/users/user.entity';
import { Channel } from 'src/channels/channel.entity';
import { SpaceEntity } from 'src/spaces/space.entity';
import { NewsEntity } from 'src/news/news.entity';

// Tipos locais (evita mismatch de shared)
type AudienceScope = {
  spaceIds?: string[];
  channelIds?: string[];
  groupIds?: string[];
};

type AudienceProbeInput = {
  companyId: string;
  newsId?: string;
  scope?: AudienceScope;
};

type AudienceProbeResult = {
  companyId: string;
  totalUsers: number;
  userIds: string[];
  breakdown: {
    fromGroups?: Record<string, number>;
  };
};

@Injectable()
export class AudienceService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(Channel) private channels: Repository<Channel>,
    @InjectRepository(SpaceEntity) private spaces: Repository<SpaceEntity>,
    @InjectRepository(NewsEntity) private news: Repository<NewsEntity>,
  ) { }

  /**
   * Resolve somente os userIds para uma news específica.
   */
  async resolveForNews(companyId: string, newsId: string): Promise<string[]> {
    const res = await this.probe({ companyId, newsId });
    return res.userIds;
  }

  /**
   * Resolve somente os userIds para um escopo arbitrário.
   */
  async resolveForScope(companyId: string, scope: AudienceScope): Promise<string[]> {
    const res = await this.probe({ companyId, scope });
    return res.userIds;
  }

  /**
   * Calcula o conjunto elegível dado companyId + (scope ou newsId).
   * Regras:
   * - se newsId: usa channelId da news e os spaceIds do canal; se os espaços tiverem targetGroupIds,
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

    // quando vier newsId, derive o canal e os spaces do canal
    if (input.newsId) {
      const n = await this.news.findOne({ where: { id: input.newsId } });
      if (n) {
        const ch = await this.channels.findOne({ where: { id: (n as any).channelId, companyId } });
        const sIds: string[] = (ch as any)?.spaceIds || [];
        if (Array.isArray(sIds) && sIds.length) {
          spaceIds = Array.from(new Set([...spaceIds, ...sIds]));
        }
      }
    }

    // escopo explícito
    if (input.scope?.channelIds?.length) {
      const chs = await this.channels.find({ where: { id: In(input.scope.channelIds), companyId } });
      const fromChannelsSpaceIds = chs.flatMap((c: any) => (c?.spaceIds || []));
      if (fromChannelsSpaceIds.length) {
        spaceIds = Array.from(new Set([...spaceIds, ...fromChannelsSpaceIds]));
      }
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
      const fromSpaces = sps.flatMap((s: any) => (s?.targetGroupIds || []));
      if (fromSpaces.length) {
        groupIds = Array.from(new Set([...groupIds, ...fromSpaces]));
      }
    }

    let eligible: UserEntity[] = [];
    const breakdown: AudienceProbeResult['breakdown'] = {};

    if (groupIds.length) {
      // membros por grupos (UserEntity.groups é text[])
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
      // fallback: todos da empresa
      eligible = await this.users.find({ where: { companyId } });
    }

    const userIds = eligible.map((u) => String((u as any).id));
    return {
      companyId,
      totalUsers: userIds.length,
      userIds,
      breakdown,
    };
  }
}