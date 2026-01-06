// backend/src/modules/access-control/access-control.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ModuleAccessGrantEntity } from './module-access-grant.entity';
import { ModuleKey, Role } from '@shared/types';
import type {
  AccessGrant,
  AccessCapabilities,
  UpsertAccessGrantDto,
} from '@shared/types/Access';
import { Channel } from 'src/channels/channel.entity';
import { SpaceEntity } from 'src/spaces/space.entity';

const ALL_MODULE_KEYS: ModuleKey[] = [
  'news',
  'channels',
  'groups',
  'surveys',
  'forms',
  'onboarding',
  'training',
  'jobs',
  'birthdays',
  'recognition',
  'quicklinks',
  'benefits',
  'vacations',
  'podcasts',
  'analytics',
  'chat',
  'journeys',
];

// módulos que **herdam** permissões quando o usuário é admin de algum space/canal
const INHERIT_BY_SPACE: ModuleKey[] = ['news', 'surveys'];

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(ModuleAccessGrantEntity)
    private grants: Repository<ModuleAccessGrantEntity>,
    @InjectRepository(SpaceEntity) private spaces: Repository<SpaceEntity>,
    @InjectRepository(Channel) private channels: Repository<Channel>,
  ) {}

  // ---- CRUD de grants (admins) ----
  async list(companyId: string, userId?: string): Promise<AccessGrant[]> {
    const where: any = { companyId };
    if (userId) where.userId = userId;
    const rows = await this.grants.find({ where });
    return rows.map(this.map);
  }

  async upsert(
    companyId: string,
    dto: UpsertAccessGrantDto,
  ): Promise<AccessGrant> {
    // regras de hierarquia: manage ⇒ edit ⇒ view
    const norm = {
      ...dto,
      canView: !!dto.canView || !!dto.canEdit || !!dto.canManage,
      canEdit: !!dto.canEdit || !!dto.canManage,
      canManage: !!dto.canManage,
    };

    if (norm.scopeType === 'SPACE_IDS') {
      if (!norm.spaceIds?.length) {
        throw new BadRequestException(
          'spaceIds é obrigatório quando scopeType=SPACE_IDS',
        );
      }
    }

    let row = await this.grants.findOne({
      where: { companyId, userId: norm.userId, moduleKey: norm.moduleKey },
    });

    if (!row) {
      row = this.grants.create({
        companyId,
        userId: norm.userId,
        moduleKey: norm.moduleKey,
        scopeType: norm.scopeType,
        spaceIds: norm.scopeType === 'SPACE_IDS' ? norm.spaceIds! : [],
        canView: norm.canView,
        canEdit: norm.canEdit,
        canManage: norm.canManage,
      });
    } else {
      row.scopeType = norm.scopeType;
      row.spaceIds = norm.scopeType === 'SPACE_IDS' ? norm.spaceIds! : [];
      row.canView = norm.canView;
      row.canEdit = norm.canEdit;
      row.canManage = norm.canManage;
      row.updatedAt = new Date();
    }

    const saved = await this.grants.save(row);
    return this.map(saved);
  }

  async remove(id: string) {
    await this.grants.delete(id);
    return { id };
  }

  // ---- capacidades calculadas ----
  async capabilities(
    companyId: string,
    user: { id: string; role: Role },
  ): Promise<AccessCapabilities> {
    const userId = String(user.id);

    // Admin organizacional ⇒ tudo liberado
    if (user.role === Role.SuperAdmin || user.role === Role.CompanyAdmin) {
      const modules = Object.fromEntries(
        ALL_MODULE_KEYS.map((k) => [
          k,
          {
            canView: true,
            canEdit: true,
            canManage: true,
            scopeType: 'ALL_SPACES' as const,
          },
        ]),
      ) as AccessCapabilities['modules'];

      return { companyId, userId, modules };
    }

    // Grants explícitos do usuário
    const rows = await this.grants.find({ where: { companyId, userId } });
    const modules: AccessCapabilities['modules'] = {};

    for (const r of rows) {
      modules[r.moduleKey as ModuleKey] = {
        canView: !!r.canView,
        canEdit: !!r.canEdit,
        canManage: !!r.canManage,
        scopeType: r.scopeType,
        ...(r.scopeType === 'SPACE_IDS' ? { spaceIds: r.spaceIds ?? [] } : {}),
      };
    }

    // Herança por admin em spaces/channels ⇒ concede view+edit por SPACE_IDS
    const companySpaces = await this.spaces.find({ where: { companyId } });
    const adminSpaceIds = companySpaces
      .filter((s) => Array.isArray(s.adminIds) && s.adminIds.includes(userId))
      .map((s) => s.id);

    const companyChannels = await this.channels.find({ where: { companyId } });
    const extraSpaceIdsFromChannels = companyChannels
      .filter((c) => Array.isArray(c.adminIds) && c.adminIds.includes(userId))
      .flatMap((c) => c.spaceIds || []);

    const inheritedSpaceIds = Array.from(
      new Set([...adminSpaceIds, ...extraSpaceIdsFromChannels]),
    );

    if (inheritedSpaceIds.length) {
      for (const modKey of INHERIT_BY_SPACE) {
        const existing = modules[modKey];
        if (!existing) {
          modules[modKey] = {
            canView: true,
            canEdit: true,
            canManage: false,
            scopeType: 'SPACE_IDS',
            spaceIds: inheritedSpaceIds,
          };
          continue;
        }

        // se já é ALL_SPACES, mantém
        if (existing.scopeType === 'ALL_SPACES') {
          // apenas garante view/edit no mínimo
          existing.canView = existing.canView || true;
          existing.canEdit = existing.canEdit || true;
          continue;
        }

        // SPACE_IDS ⇒ une os espaços e eleva view/edit
        const current = new Set(existing.spaceIds || []);
        inheritedSpaceIds.forEach((id) => current.add(id));
        existing.spaceIds = Array.from(current);
        existing.canView = existing.canView || true;
        existing.canEdit = existing.canEdit || true;
      }
    }

    return { companyId, userId, modules };
  }

  // ---- mapper para o shared ----
  private map = (e: ModuleAccessGrantEntity): AccessGrant => ({
    id: e.id,
    companyId: e.companyId,
    userId: e.userId,
    moduleKey: e.moduleKey as ModuleKey,
    scopeType: e.scopeType,
    spaceIds: e.spaceIds ?? [],
    canView: !!e.canView,
    canEdit: !!e.canEdit,
    canManage: !!e.canManage,
    updatedAt: e.updatedAt,
  });
}
