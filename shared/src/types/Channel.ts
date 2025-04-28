export interface Channel {
  id: string;
  name: string;
  description?: string;

  /* multi-tenant */
  companyId: string;

  /* visibilidade */
  spaceIds?: string[];
  groupIds?: string[];

  /* permissões de gestão do canal */
  contributorIds?: string[];
  adminIds?: string[];
}
