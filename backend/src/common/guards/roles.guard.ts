import { CanActivate, ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@shared/types'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ])
        if (!required?.length) return true
        const req = ctx.switchToHttp().getRequest()
        const user = req.user as { roles?: Role[], companyId?: string } | undefined
        if (!user?.roles?.length) throw new ForbiddenException('No roles')

        // SuperAdmin passa em tudo
        if (user.roles.includes(Role.SuperAdmin)) return true

        const ok = required.some(r => user.roles!.includes(r))
        if (!ok) throw new ForbiddenException('Insufficient role')
        return true
    }
}