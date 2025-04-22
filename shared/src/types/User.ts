import { Role } from './Role';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  password: string;
  role: Role;
  companyId: string;
  spaceId?: string;
  groups?: string[];
  visibleGroups?: string[];
  recoveryToken?: string;
  recoveryTokenExpiration?: Date;
  phone?: string;
  avatarUrl?: string;
  locale?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
