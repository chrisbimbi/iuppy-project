// src/modules/news/components/helpers/validationSchemas.ts

import * as Yup from 'yup';
import { NewsType } from '@shared/types';

export const createNewSchema = Yup.object().shape({
  title: Yup.string().required('O título é obrigatório'),
  subtitle: Yup.string(), // Novo campo
  content: Yup.string().required('O conteúdo é obrigatório'),
  type: Yup.mixed<NewsType>().oneOf(Object.values(NewsType)).required('O tipo é obrigatório'),
  authorId: Yup.string().required('O ID do autor é obrigatório'),
  targetAudience: Yup.array().of(Yup.string()).min(1, 'Selecione pelo menos um público-alvo'),
  isPublished: Yup.boolean(),
  highlightImages: Yup.array().of(
    Yup.mixed().test('fileSize', 'O arquivo é muito grande', function (value) {
      if (!value || !(value instanceof File)) return true;
      return value.size <= 10485760; // 5MB
    })
  ),
  attachments: Yup.array().of(
    Yup.mixed().test('fileSize', 'O arquivo é muito grande', function (value) {
      if (!value || !(value instanceof File)) return true;
      return value.size <= 10485760; // 10MB
    })
  ),
  settings: Yup.object().shape({
    visibility: Yup.string().oneOf(['public', 'private', 'specific_groups']).required(),
    allowComments: Yup.boolean().required(),
    moderateComments: Yup.boolean().required(),
    allowReactions: Yup.boolean().required(),
    notifyUsers: Yup.boolean().required(),
    pushNotification: Yup.boolean().required(),
    emailNotification: Yup.boolean().required(),
    allowSharing: Yup.boolean().required(),
    showAuthor: Yup.boolean().required(),
    showPublishDate: Yup.boolean().required(),
    pinToTop: Yup.boolean().required(),
    expirationDate: Yup.date().nullable(),
    schedulePublishDate: Yup.date().nullable(),
  }),
  engagementMetrics: Yup.object().shape({
    views: Yup.number().min(0),
    uniqueViews: Yup.number().min(0),
    reactions: Yup.object().shape({
      LIKE: Yup.number().min(0),
      LOVE: Yup.number().min(0),
      APPLAUSE: Yup.number().min(0),
      CELEBRATE: Yup.number().min(0),
    }),
    comments: Yup.number().min(0),
    shares: Yup.number().min(0),
    averageTimeSpent: Yup.number().min(0),
  }),
});