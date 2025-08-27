import { Role } from '@shared/types'

export interface AuthModel {
  api_token: string
}

export interface UserModel {
  /** mapeia payload.sub do backend */
  id: string
  email: string
  role: Role
  companyId: string

  /** Campos extras opcionais (deixa o app respirar) */
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