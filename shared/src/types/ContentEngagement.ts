import { ReactionsType } from './ReactionsType';

export interface ContentEngagement {
  views: number;
  uniqueViews: number;
  reactions: ReactionsType;
  comments: number;
  shares: number;
  averageTimeSpent: number;
}
