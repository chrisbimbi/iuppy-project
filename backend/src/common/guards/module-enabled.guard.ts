import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CompanyModulesService } from 'src/modules/company-modules/company-modules.service'
import { Role } from '@shared/types'
import { ROLES_KEY } from './roles.guard'

export const MODULE_KEY = 'moduleKey'
export const ModuleEnabled = (moduleKey: string) => SetMetadata(MODULE_KEY, moduleKey)

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
    constructor(private reflector: Reflector, private cmService: CompanyModulesService) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const key = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
            ctx.getHandler(), ctx.getClass(),
        ])
        if (!key) return true
        const req = ctx.switchToHttp().getRequest()
        const companyId = req.params?.companyId || req.user?.companyId
        if (!companyId) throw new ForbiddenException('CompanyId ausente')

        // SuperAdmin ignora gating
        const roles: Role[] = req.user?.roles || []
        if (roles.includes(Role.SuperAdmin)) return true

        const mod = await this.cmService.get(companyId, key as any)
        if (!mod?.enabled) throw new ForbiddenException(`Módulo "${key}" desabilitado`)
        return true
    }
}