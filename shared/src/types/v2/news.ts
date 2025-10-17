import { ReactionKind } from './interactions';
import { AudienceFilter } from './segmentation';

export type NewsStatus = 'draft' | 'published' | 'archived';

export interface NewsAttachment {
  name?: string | null;
  url: string;
}

export interface NewsSettingsV2 {
  // Interações
  acknowledgementRequired: boolean;
  allowReactions: boolean;
  allowedReactionKinds?: ReactionKind[];   // default: todas
  allowComments: boolean;
  commentsRequireModeration: boolean;
  shareEnabled: boolean;

  // Notificações
  pushNotificationEnabled: boolean;
  emailNotificationEnabled: boolean;
  autoRemindNotOpened?: {
    enabled: boolean;
    afterHours?: number; // ex.: 24
    maxSends?: number;   // ex.: 1
  };

  // Publicação/visibilidade
  publishAt?: string | null;
  expireAt?: string | null;
  pinned?: boolean;
  priority?: number | null;

  // Alcance (quem recebe)
  audienceFilter?: AudienceFilter; // vazio => company-wide

  // Extensões futuras
  extensions?: Record<string, unknown>;

  // Versão do contrato
  version: 2;
}

export interface NewsBaseFields {
  title: string;
  subtitle?: string | null;
  contentHtml: string;
  highlightImages: string[];
  attachments: NewsAttachment[];
  spaceId?: string | null;   // organização/UX; pode ser null
  channelId?: string | null; // organização/UX; pode ser null
  settings: NewsSettingsV2;
}

export interface NewsCreateV2 extends NewsBaseFields {}

export interface NewsUpdateV2 extends Partial<NewsBaseFields> {
  status?: NewsStatus;
}

export interface NewsDetailV2 {
  id: string;
  companyId: string;
  authorId?: string | null;
  status: NewsStatus;

  // Conteúdo
  title: string;
  subtitle?: string | null;
  contentHtml: string;
  highlightImages: string[];
  attachments: NewsAttachment[];

  // Organização
  spaceId: string | null;
  spaceName: string | null;
  channelId: string | null;
  channelName: string | null;

  // Regras
  settings: NewsSettingsV2;

  // Estado do usuário e contagens
  userState: {
    isRead: boolean;
    readAt?: string | null;
    myReaction?: ReactionKind | null;
  };
  counts: {
    uniqueOpens: number;
    acks: number;
    reactionsTotal: number;
    commentsTotal: number;
    sharesTotal: number;
  };

  createdAt: string;
  updatedAt: string | null;
}