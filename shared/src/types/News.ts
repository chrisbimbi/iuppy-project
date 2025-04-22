import { NewsSettings } from './NewsSettings';
import { NewsType } from './NewsType';


export interface News {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  channelId: string;
  authorId: string;
  companyId: string;
  type: NewsType;
  isPublished: boolean;
  attachments: string[];
  highlightImages: string[];
  settings: NewsSettings;
  createdAt: Date;
  updatedAt: Date;
}
