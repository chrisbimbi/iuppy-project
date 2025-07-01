export interface Channel {
  type: string;
  id: string;
  name: string;
  description?: string;

  /** multi-tenant */
  companyId: string;

  /** visibilidade: spaces em que este canal vive */
  spaceIds?: string[];

  /** segmentação adicional por grupos */
  groupIds?: string[];

  /** quem pode contribuir neste canal */
  contributorIds?: string[];

  /** quem é admin deste canal */
  adminIds?: string[];

  /** publicado / despublicado */
  isPublished?: boolean;
}

export enum ChannelType {
  ARTICLES = 'articles',
  MEDIA = 'media',
  UPDATES = 'updates',
}