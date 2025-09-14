// v2 – Feed “me”

export type MeFeedQuery = {
  spaceId?: string;      // filtro de espaço (opcional)
  channelId?: string;    // filtro de canal (opcional)
  limit?: number;        // padrão 20
  cursor?: string;       // paginação (createdAt DESC)
};

export type MeFeedItem = {
  id: string;
  title: string;
  subtitle?: string;
  createdAt: string;
  updatedAt: string;
  channelId: string;
  spaceIds: string[];
  isPublished: boolean;
  highlightImages?: string[];
  // estado do usuário
  userState: {
    opened: boolean;
    acknowledged: boolean;
    myReaction?: string;
    myComments?: number;
  };
};

export type MeFeedCounters = {
  totalUnread: number;
  bySpace: Record<string, number>;
  byChannel: Record<string, number>;
};

export type MeFeedResponse = {
  items: MeFeedItem[];
  nextCursor?: string;
  counters: MeFeedCounters; // incluído para evitar requisições extras
};