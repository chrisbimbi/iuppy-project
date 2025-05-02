// shared/src/types/NewsSettings.ts
export interface NewsSettings {
  visibility: 'public' | 'private' | 'specific_groups';
  targetAudience: string[];               // públicos específicos
  allowComments: boolean;
  moderateComments: boolean;
  allowReactions: boolean;
  notifyUsers: boolean;                   // email interno
  pushNotification: boolean;
  pushContent?: string;
  pushTitle?: string;
  emailNotification: boolean;
  inAppNotification: boolean;             // notificação in-app
  allowSharing: boolean;
  showAuthor: boolean;
  showPublishDate: boolean;
  pinToTop: boolean;
  schedulePublication: boolean;
  schedulePublishDate?: Date;
  expirePublication: boolean;
  expirationDate?: Date;
  acknowledgementRequired: boolean;       // “Li e aceito”
  maxAudienceSize?: number;
  restrictAccess?: boolean;
}