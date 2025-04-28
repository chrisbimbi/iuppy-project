import { CreateNewsDto } from '../../../shared/src/types/CreateNewsDto';
import { NewsType } from '../../../shared/src/types/NewsType';

export const initialNewsValues: CreateNewsDto = {
  title: '',
  content: '',
  type: NewsType.ANNOUNCEMENT,
  authorId: '',
  channelId: '',
  isPublished: false,
  attachments: [],
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
  createdAt: undefined,
  updatedAt: undefined,
  companyId: ''
};