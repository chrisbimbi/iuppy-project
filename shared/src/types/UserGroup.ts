// shared/src/types/UserGroup.ts

import { UserGroupType } from "../constants/UserGroupType"

/** Tipagem principal do grupo de usuários */
export interface UserGroup {
  id: string
  companyId: string
  name: string
  identifier?: string
  type: UserGroupType
  conditions: string[]
  adminIds: string[]
  createdAt: Date
  updatedAt: Date
}

/** DTO para criação de um novo grupo */
export interface CreateGroupDto {
  companyId: string
  name: string
  identifier?: string
  type: UserGroupType
  conditions: string[]
  adminIds: string[]
}

/** DTO para atualização de um grupo existente */
export interface UpdateGroupDto {
  name?: string
  identifier?: string
  type: UserGroupType
  conditions?: string[]
  adminIds?: string[]
}