// src/app/modules/news/components/initialNewValues.ts
import { CreateNewsDto, NewsType } from '@shared/types'

export const initialNewValues: CreateNewsDto = {
  title: '',
  subtitle: '',
  content: '',
  type: NewsType.ANNOUNCEMENT,
  authorId: '',
  channelId: '', // já existe, mas vai ser sobrescrito  attachments: [],
  highlightImages: [],
  settings: {
    visibility: 'public',
    targetAudience: [],               // públicos específicos
    allowComments: false,
    moderateComments: false,
    allowReactions: false,
    notifyUsers: false,                   // email interno
    pushNotification: false,
    pushTitle: '',
    pushContent: '',
    emailNotification: false,
    inAppNotification: false,             // notificação in-app
    allowSharing: false,
    showAuthor: false,
    showPublishDate: false,
    pinToTop: false,
    schedulePublication: false,
    schedulePublishDate: undefined,
    expirePublication: false,
    expirationDate: undefined,
    acknowledgementRequired: false,       // “Li e aceito”
    maxAudienceSize: undefined,
    restrictAccess: false,
  },
  isPublished: false,
  attachments: [],
  companyId: ''
}
