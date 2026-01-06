import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    // companyId pode vir de param, header, token… aqui priorizamos route param
    return req.params?.companyId || req.user?.companyId;
  },
);
