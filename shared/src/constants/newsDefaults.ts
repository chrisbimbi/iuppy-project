// shared/src/constants/newsDefaults.ts
import { NewsSettings } from '../types/NewsSettings';

export const newsSettingsDefaults: NewsSettings = {
  visibility: 'public',
  targetAudience: [],

  allowComments: true,
  moderateComments: false,
  allowReactions: true,

  notifyUsers: false,
  pushNotification: false,
  emailNotification: false,
  inAppNotification: false,

  allowSharing: false,

  showAuthor: false,
  showPublishDate: false,
  pinToTop: false,

  schedulePublication: false,
  expirePublication: false,

  // campos opcionais
  acknowledgementRequired: false,
  maxAudienceSize: undefined,
  restrictAccess: undefined
};