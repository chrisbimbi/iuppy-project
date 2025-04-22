export interface Channel {
  id: string;
  name: string;
  description?: string;
  companyId: string;

  // trocar locationIds por spaceIds
  spaceIds?: string[];
  groupIds?: string[];

  contributorIds?: string[];
  adminIds?: string[];
}
