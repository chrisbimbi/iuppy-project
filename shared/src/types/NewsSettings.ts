// shared/src/types/NewsSettings.ts
export enum AudienceMode {
  COMPANY = 'COMPANY',
  SPACE = 'SPACE',
  CHANNEL = 'CHANNEL',
  GROUPS = 'GROUPS',
  LOGICAL = 'LOGICAL',
}

export interface NewsSettings {
  audienceMode?: AudienceMode;
  audienceSpaceId?: string;
  audienceChannelIds?: string[];
  audienceGroupIds?: string[];

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

  // 🔸 REMOVIDO: publishedAt não pertence ao settings
  // publishedAt?: string | Date;  ← remover

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

  audienceSnapshot?: {
    totalUsuarios: number;
    comTokenAtivo: number;
    mode: AudienceMode;
    identifiers: Record<string, any>;
  };

  restrictAccess?: boolean;
}
