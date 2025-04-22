export interface Space {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  priority?: number;
  active?: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
