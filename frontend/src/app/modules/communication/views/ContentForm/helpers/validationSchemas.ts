// src/app/modules/news/components/helpers/validationSchemas.ts
import * as Yup from 'yup'
import { NewsType } from '@shared/types'

export const createNewSchema = Yup.object().shape({
  title: Yup.string().required('O título é obrigatório'),
  subtitle: Yup.string(),
  content: Yup.string().required('O conteúdo é obrigatório'),
  type: Yup.mixed<NewsType>().oneOf(Object.values(NewsType)).required('O tipo é obrigatório'),
  authorId: Yup.string().required('O ID do autor é obrigatório'),
  isPublished: Yup.boolean(),
  highlightImages: Yup.array().of(
    Yup.mixed().test('fileSize', 'Arquivo muito grande', v => !(v instanceof File) || v.size <= 10485760)
  ),
  attachments: Yup.array().of(
    Yup.mixed().test('fileSize', 'Arquivo muito grande', v => !(v instanceof File) || v.size <= 10485760)
  ),
  settings: Yup.object().shape({
    visibility: Yup.string().oneOf(['public', 'private', 'specific_groups']).required(),
    allowComments: Yup.boolean().required(),
    moderateComments: Yup.boolean().required(),
    allowReactions: Yup.boolean().required(),
    notifyUsers: Yup.boolean().required(),
    pushNotification: Yup.boolean().required(),
    pushTitle: Yup.string(),
    pushContent: Yup.string(),
    emailNotification: Yup.boolean().required(),
    allowSharing: Yup.boolean().required(),
    showAuthor: Yup.boolean().required(),
    showPublishDate: Yup.boolean().required(),
    pinToTop: Yup.boolean().required(),
    schedulePublication: Yup.boolean().required(),
    expirePublication: Yup.boolean().required(),
    expirationDate: Yup.date().nullable(),
    schedulePublishDate: Yup.date().nullable(),
    targetAudience: Yup.array().of(Yup.string()),

  })
})
