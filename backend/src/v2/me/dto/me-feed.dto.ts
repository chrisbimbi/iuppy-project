// src/v2/me/dto/me-feed.dto.ts
export type ReactionKind = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

export interface MeFeedQuery {
  limit?: number;            // 1..50 (default 20)
  cursor?: string | null;    // "<createdAtISO>|<uuid>"
  spaceId?: string;
  channelId?: string;
}

export interface MeFeedCountersDTO {
  totalUnread: number;
  bySpace: Record<string, number>;
  byChannel: Record<string, number>;
}

export interface MeFeedItemDTO {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  highlightImages: string[];
  attachments: { name?: string | null; url: string }[];
  spaceId: string | null;
  spaceName: string | null;
  channelId: string | null;
  channelName: string | null;
  settings: {
    acknowledgementRequired: boolean;
    allowReactions: boolean;
    allowComments: boolean;
    commentsRequireModeration: boolean;
    shareEnabled: boolean;
  };
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
}

export interface MeFeedResponseDTO {
  items: MeFeedItemDTO[];
  counters: MeFeedCountersDTO;
  nextCursor?: string | null;
  etag: string;
  serverTime: string;
}