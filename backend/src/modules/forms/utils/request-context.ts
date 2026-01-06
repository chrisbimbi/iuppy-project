// util simples pra pegar companyId/userId mesmo se o guard não preencheu req.user
export function getCompanyId(req: any): string {
  return (
    req?.user?.companyId ||
    req?.headers?.['x-company-id'] ||
    req?.headers?.['x-companyid'] ||
    req?.query?.companyId ||
    ''
  );
}

export function getUserId(req: any): string {
  return (
    req?.user?.id ||
    req?.headers?.['x-user-id'] ||
    req?.headers?.['x-userid'] ||
    req?.query?.userId ||
    ''
  );
}
