import { Injectable } from '@nestjs/common';
import { AccessGrantsService } from './access-grants.service';
import { Role } from '@shared/types';
import { AccessCapabilities } from '@shared/types/Access';

const ALL_MODULES = [
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
] as const;

@Injectable()
export class CapabilitiesService {
  constructor(private grants: AccessGrantsService) {}

  async forUser(
    companyId: string,
    user: { id: string; role: Role },
  ): Promise<AccessCapabilities> {
    // SuperAdmin -> total
    if (user.role === Role.SuperAdmin) {
      const modules: AccessCapabilities['modules'] = {};
      ALL_MODULES.forEach((k) => {
        modules[k] = {
          canView: true,
          canEdit: true,
          canManage: true,
          scopeType: 'ALL_SPACES',
        };
      });
      return { companyId, userId: String(user.id), modules };
    }

    // CompanyAdmin -> por padrão, total (pode ajustar política depois)
    if (user.role === Role.CompanyAdmin) {
      const modules: AccessCapabilities['modules'] = {};
      ALL_MODULES.forEach((k) => {
        modules[k] = {
          canView: true,
          canEdit: true,
          canManage: true,
          scopeType: 'ALL_SPACES',
        };
      });
      return { companyId, userId: String(user.id), modules };
    }

    // Demais perfis -> somatório dos grants
    const rows = await this.grants.list(companyId, String(user.id));
    const modules: AccessCapabilities['modules'] = {};

    for (const r of rows) {
      const prev = modules[r.moduleKey as keyof typeof modules];
      const curr = {
        canView: !!r.canView || prev?.canView || false,
        canEdit: !!r.canEdit || prev?.canEdit || false,
        canManage: !!r.canManage || prev?.canManage || false,
        scopeType: r.scopeType,
        spaceIds: r.scopeType === 'SPACE_IDS' ? (r.spaceIds ?? []) : undefined,
      };

      // Se já havia ALL_SPACES, mantém ALL_SPACES
      if (prev?.scopeType === 'ALL_SPACES' || curr.scopeType === 'ALL_SPACES') {
        curr.scopeType = 'ALL_SPACES';
        curr.spaceIds = undefined;
      }

      modules[r.moduleKey as keyof typeof modules] = curr;
    }

    return { companyId, userId: String(user.id), modules };
  }
}
