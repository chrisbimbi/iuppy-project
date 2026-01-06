import { Request } from 'express';
import { Role } from '@shared/types';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sub?: string;
    email?: string;
    role: Role;
    companyId: string;
    roles?: string[];
    [key: string]: any;
  };
}
