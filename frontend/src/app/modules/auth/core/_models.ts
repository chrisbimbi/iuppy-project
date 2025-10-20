// src/app/modules/auth/core/_models.ts
import { Role } from '@shared/types'

export type AuthModel = {
  /** access token (JWT) */
  api_token: string
  /** (LEGADO) refreshToken — não usamos mais; refresh vem por cookie httpOnly */
  refreshToken?: string
}

export interface UserModel {
  id: string
  email: string
  role: Role
  companyId: string
  username?: string
  firstname?: string
  lastname?: string
  phone?: string
  locale?: string
  timezone?: string
  active?: boolean
  employeeId?: string
  title?: string
  hireDate?: Date
  terminationDate?: Date
  lastLogin?: Date
  firstLogin?: Date
  profilePicture?: string
  spaceIds?: string[]
  groupIds?: string[]
  password?: string
}