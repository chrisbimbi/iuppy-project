import { ReactionsType } from './ReactionsType';

export interface EngagementMetrics {
  views: number;
  uniqueViews: number;
  reactions: ReactionsType;
  comments: number;
  shares: number;
  averageTimeSpent: number;
}
