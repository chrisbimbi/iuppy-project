import { EngagementMetrics, Role, UserEngagement } from "@shared/types";

export interface AuthModel {
  api_token: string
  refreshToken?: string
}

export interface UserModel {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  locale?: string;
  timezone?: string;
  active: boolean;
  employeeId?: string;
  title: string;
  hireDate: Date;
  terminationDate?: Date;
  lastLogin?: Date;
  firstLogin?: Date;
  profilePicture?: string;
  engagementMetrics: UserEngagement;
  role: Role;
  companyId: string;
  spaceIds?: string[];
  groupIds?: string[];
  auth: AuthModel; // Adicionando a propriedade auth
  password: string;
}