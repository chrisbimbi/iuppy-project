import { SurveyStatus } from './Survey';

export interface CreateSurveyDto {
  companyId: string;
  title: string;
  description?: string;

  authorId: string;
  adminIds: string[];
  spaceIds: string[];

  visibility: 'public' | 'private' | 'specific_groups';
  /** opcional; exigido apenas quando visibility === 'specific_groups' */
  groupIds?: string[];

  notifyUsers: boolean;
  pushNotification: boolean;
  pushContent?: string;
  pushTitle?: string;
  acknowledgementRequired: boolean;
  emailNotification: boolean;
  inAppNotification: boolean;

  isAnonymous: boolean;

  scheduleSurvey: boolean;
  expireSurvey: boolean;
  startsAt: Date | string;
  endsAt: Date | string | null;

  status?: SurveyStatus;

  createdAt?: string;
  updatedAt?: string;
}