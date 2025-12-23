export * from './create-announcement.dto';
export * from './update-announcement.dto';

export interface AnnouncementPaginatedResponse {
  data: any[]; // Will be typed as Announcement[] in actual response
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
