export interface NewsSettings {
  visibility: 'public' | 'private' | 'specific_groups';
  targetAudience: string[];

  allowComments: boolean;
  moderateComments: boolean;
  allowReactions: boolean;

  notifyUsers: boolean;
  pushNotification: boolean;
  pushContent?: string;
  pushTitle?: string;
  emailNotification: boolean;
  inAppNotification: boolean;

  allowSharing: boolean;
  shareUrl?: string;
  shareText?: string;

  showAuthor: boolean;
  showPublishDate: boolean;
  pinToTop: boolean;

  schedulePublication: boolean;
  schedulePublishDate?: Date;

  expirePublication: boolean;
  expirationDate?: Date;

  acknowledgementRequired: boolean;
  maxAudienceSize?: number;
  restrictAccess?: boolean;
}