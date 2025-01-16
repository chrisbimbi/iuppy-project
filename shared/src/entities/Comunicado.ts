import { ComunicadoType, ContentEngagement } from '../types/';

export interface Comunicado {
  id: string;
  title: string;
  content: string;
  type: ComunicadoType;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  targetAudience: string[];
  isPublished: boolean;
  attachments?: string[];
  engagementMetrics: ContentEngagement;
}