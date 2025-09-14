// v2 – Interações de News

export type ReactionType = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

export type NewsOpenDto = { newsId: string };
export type NewsAckDto  = { newsId: string };
export type NewsReactDto = { newsId: string; reaction: ReactionType };
export type NewsCommentCreateDto = { newsId: string; text: string };
export type NewsCommentModerateDto = { approve: boolean };

export type NewsInteractionSnapshot = {
  newsId: string;
  totalOpens: number;
  uniqueOpens: number;
  acknowledgements: number;
  reactions: Partial<Record<ReactionType, number>>;
  comments: number;
  shares: number;
};