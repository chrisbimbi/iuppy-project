// src/app/modules/news/components/helpers/validationSchemas.ts
import * as Yup from 'yup'

import { IntlShape } from 'react-intl'

export const createNewSchema = (intl: IntlShape) => Yup.object().shape({
  title: Yup.string().required(intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.TITLE_REQUIRED' })),
  subtitle: Yup.string(),
  content: Yup.string().required(intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.CONTENT_REQUIRED' })),
  hashtags: Yup.array().of(Yup.string()),
  authorId: Yup.string().required(intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.AUTHOR_REQUIRED' })),
  isPublished: Yup.boolean(),
  highlightImages: Yup.array().of(
    Yup.mixed().test('fileSize', intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.FILE_TOO_LARGE' }), v => !(v instanceof File) || v.size <= 10485760)
  ),
  attachments: Yup.array().of(
    Yup.mixed().test('fileSize', intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.FILE_TOO_LARGE' }), v => !(v instanceof File) || v.size <= 10485760)
  ),
  settings: Yup.object().shape({
    visibility: Yup.string().oneOf(['public', 'private', 'specific_groups']).required(),
    allowComments: Yup.boolean().required(),
    moderateComments: Yup.boolean().required(),
    allowReactions: Yup.boolean().required(),
    notifyUsers: Yup.boolean().required(),
    pushNotification: Yup.boolean().required(),
    pushTitle: Yup.string().when('pushNotification', {
      is: true,
      then: (s) => s.trim().required(intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.PUSH_TITLE_REQUIRED' })),
      otherwise: (s) => s.notRequired(),
    }),
    pushContent: Yup.string().when('pushNotification', {
      is: true,
      then: (s) => s.trim().required(intl.formatMessage({ id: 'COMMUNICATION.FORM.VALIDATION.PUSH_CONTENT_REQUIRED' })),
      otherwise: (s) => s.notRequired(),
    }),
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
