import { NewsSettings } from './NewsSettings';



export interface News {
  id: string;
  title: string;
  subtitle?: string;
  mustAcknowledge?: boolean;
  userState?: {
    isFavorited?: boolean;
    myReaction?: string | null;
    hasViewed?: boolean;
    hasCommented?: boolean;
    hasShared?: boolean;
    hasAcknowledged?: boolean;
  };
  content: string;
  channelId: string;
  authorId: string;
  companyId: string;
  hashtags?: string[];
  isPublished: boolean;
  attachments: string[];
  highlightImages: string[];
  settings: NewsSettings;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: string | Date;

}
