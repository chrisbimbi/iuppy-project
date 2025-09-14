// v2 – Segmentação & capacidades

export type AudienceScope = {
  spaceIds?: string[];      // espaços alvo
  channelIds?: string[];    // canais alvo
  groupIds?: string[];      // grupos alvo
};

export type AudienceProbeInput = {
  companyId: string;
  scope?: AudienceScope;
  // newsId opcional para auditar uma notícia específica (usa channelId/spaceIds dela)
  newsId?: string;
};

export type AudienceProbeResult = {
  companyId: string;
  totalUsers: number;         // usuários elegíveis (denominador)
  userIds: string[];          // (opcional no CMS) — omitido no app
  breakdown: {
    fromSpaces?: Record<string, number>;   // spaceId -> qtde elegíveis via space
    fromChannels?: Record<string, number>; // channelId -> qtde elegíveis via canal
    fromGroups?: Record<string, number>;   // groupId -> qtde elegíveis via grupo
  };
};