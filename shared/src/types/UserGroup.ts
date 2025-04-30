import { GroupType } from '../constants/GroupType';

export interface UserGroup {
  id: string;
  companyId: string;
  name: string;
  identifier?: string;
  type: GroupType;
  conditions?: string[];     // para grupos condicionais
  adminIds: string[];        // quem gerencia o grupo
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserGroupDto {
  companyId: string;
  name: string;
  identifier?: string;
  type: GroupType;
  conditions?: string[];
  adminIds?: string[];
}

export interface UpdateUserGroupDto {
  name?: string;
  identifier?: string;
  type?: GroupType;
  conditions?: string[];
  adminIds?: string[];
}