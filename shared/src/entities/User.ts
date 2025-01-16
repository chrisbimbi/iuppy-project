import { Role, UserEngagement } from '../types/';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  position: string;
  hireDate: Date;
  isActive: boolean;
  lastLogin?: Date;
  engagementMetrics: UserEngagement;
}