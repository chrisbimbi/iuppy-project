import { CreateNewsDto, NewsType } from '@shared/types';

/**
 * Este objeto contém os valores iniciais para a criação de um new.
 * 
 * Certifique-se de que as propriedades declaradas aqui correspondem exatamente 
 * ao tipo CreateNewDto definido na pasta shared.
 */
export const initialNewValues: CreateNewsDto = {
  title: '',
  subtitle: '',
  content: '',
  type: NewsType.ANNOUNCEMENT,
  authorId: '',
  channelId: '',
  // Removemos "id", "createdAt" e "updatedAt", pois esses campos não fazem parte do DTO
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
  isPublished: false
};