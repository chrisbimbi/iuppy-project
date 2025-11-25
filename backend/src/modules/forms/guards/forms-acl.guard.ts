// backend/src/modules/forms/guards/forms-acl.guard.ts

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

type FormAclRole = 'owner' | 'editor' | 'viewer';

@Injectable()
export class FormsAclGuard implements CanActivate {
    private readonly logger = new Logger(FormsAclGuard.name);

    constructor(private readonly ds: DataSource) { }

    // ======================================================
    // 🔥 CORREÇÃO: Usando os getters corretos (baseados no seu S1 controller)
    // ======================================================
    private getCompanyId(req: any): string | null {
        return (
            req?.user?.companyId ||
            req?.user?.company?.id || // A sua estrutura de token
            req?.headers?.['x-company-id'] ||
            null
        );
    }

    private getUserId(req: any): string | null {
        return req?.user?.id || req?.user?.sub || null;
    }
    // ======================================================

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const formId = request.params.formId;

        // 1. Resolve o utilizador e o companyId a partir do token (agora da forma correta)
        const userId = this.getUserId(request);
        const companyId = this.getCompanyId(request);
        const userRole = request.user?.role;

        if (!userId || !companyId) {
            this.logger.warn('ACL Guard: Usuário ou CompanyId não encontrado no token.');
            throw new ForbiddenException('Acesso negado: Token inválido.');
        }

        if (!formId) {
            this.logger.warn('ACL Guard: formId não encontrado nos parâmetros da rota.');
            return false; // Não devia acontecer se a rota estiver correta
        }

        // 2. O Super Admin ou Admin da Companhia sempre tem acesso
        if (userRole === 'super_admin' || userRole === 'company_admin') {
            return true;
        }

        // 3. Verifica o ACL no banco de dados
        try {
            const form = await this.ds.query(
                `SELECT "acl", "createdBy" FROM "form" WHERE "id" = $1 AND "companyId" = $2`,
                [formId, companyId],
            );

            if (!form || form.length === 0) {
                throw new NotFoundException('Formulário não encontrado ou não pertence a esta companhia.');
            }

            const acl = form[0].acl ?? {};
            const createdBy = form[0].createdBy;

            // 4. O criador do formulário sempre tem acesso
            if (createdBy === userId) {
                return true;
            }

            // 5. Verifica as listas de ACL (owners, editors, viewers)
            const roles: FormAclRole[] = ['owner', 'editor', 'viewer'];
            for (const role of roles) {
                if (Array.isArray(acl[role]) && acl[role].includes(userId)) {
                    return true; // Encontrado!
                }
            }

            this.logger.warn(`ACL Negado: Usuário ${userId} tentou aceder ao form ${formId} sem permissão.`);
            throw new ForbiddenException('Você não tem permissão para aceder a este formulário.');

        } catch (e) {
            if (e instanceof ForbiddenException || e instanceof NotFoundException) throw e;
            const msg = (e as any)?.message ?? String(e);
            const stack = (e as any)?.stack;
            this.logger.error(`ACL Erro: ${msg}`, stack);
            throw new ForbiddenException('Erro ao verificar permissões de acesso.');
        }
    }
}