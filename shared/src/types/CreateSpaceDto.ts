export interface CreateSpaceDto {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    priority?: number;
    active?: boolean;
    companyId: string;
  }
  