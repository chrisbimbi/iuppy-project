export interface NewsSettings {
  visibility: 'public' | 'private' | 'specific_groups'; // Tornado obrigatório para refletir o backend
  allowComments: boolean;
  moderateComments: boolean;
  allowReactions: boolean;
  notifyUsers: boolean;
  pushNotification: boolean;
  emailNotification: boolean;
  allowSharing: boolean;
  showAuthor: boolean;
  showPublishDate: boolean;
  pinToTop: boolean;
  schedulePublication: boolean;
  expirePublication: boolean;
  pushTitle?: string; // Tornado opcional, caso o backend permita ausência de título no push
  pushContent?: string; // Tornado opcional, caso o backend permita ausência de conteúdo no push
  expirationDate?: Date; // Data de expiração opcional
  schedulePublishDate?: Date; // Data de publicação agendada opcional
  targetAudience?: string[]; // Público-alvo obrigatório
  maxAudienceSize?: number; // Adicionado caso o backend limite o tamanho do público
  restrictAccess?: boolean; // Adicionado para refletir restrições de acesso, se aplicável
}