export * from './Role';
export * from './ComunicadoType';
export * from './UserEngagement';
export * from './ContentEngagement';

export type PaginationParams = {
  page: number;
  limit: number;
}

export type SortOrder = 'ASC' | 'DESC';

export type DateRange = {
  startDate: Date;
  endDate: Date;
}