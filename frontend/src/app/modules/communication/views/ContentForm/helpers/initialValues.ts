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
    allowComments: true,
    moderateComments: false,
    allowReactions: true,
    notifyUsers: false,
    pushNotification: false,
    emailNotification: false,
    allowSharing: true,
    showAuthor: true,
    showPublishDate: true,
    pinToTop: false,
    schedulePublication: false,
    expirePublication: false,
    pushTitle: '',
    pushContent: '',
    expirationDate: undefined,
    schedulePublishDate: undefined,
    targetAudience: []
  },
  isPublished: false,
  attachments: [],
  companyId: ''
}
