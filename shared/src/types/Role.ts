// shared/src/types/Role.ts
export enum Role {
  SuperAdmin = 'super_admin',     // iuppy - setup global/tenants
  CompanyAdmin = 'company_admin', // administra a conta da empresa
  HRAdmin = 'hr_admin',           // RH: jornadas, formulários, treinamentos
  ContentAdmin = 'content_admin', // publica/edita News/Channels
  Manager = 'manager',            // líderes com acesso a relatórios do seu time
  Editor = 'editor',              // edita rascunhos sob aprovação
  Viewer = 'viewer',              // somente leitura no CMS
}