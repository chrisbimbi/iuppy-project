export type ReactionKind = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

export interface UserStateDTO {
  isRead: boolean;
  readAt?: string | null;
  myReaction?: ReactionKind | null;
}

export interface CountsDTO {
  uniqueOpens: number;
  acks: number;
  reactionsTotal: number;
  commentsTotal: number;
  sharesTotal: number;
}