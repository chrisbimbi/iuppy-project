import { ContentEngagement } from '../types/';

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  uploaderId: string;
  uploadDate: Date;
  categories: string[];
  isPublic: boolean;
  engagementMetrics: ContentEngagement;
}