import type { ApiResponse } from "~/types/api";
import type { User, Kelas, Announcement } from "~/types/entities";

export type { Announcement } from "~/types/entities";

/**
 * Announcement API Wrapper
 */

export interface CreateAnnouncementRequest {
  judul: string;
  isi: string;
  scope: "GLOBAL" | "KELAS";
  kelasId?: string;
}

export interface UpdateAnnouncementRequest {
  judul?: string;
  isi?: string;
}

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AnnouncementPaginatedResponse {
  data: Announcement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const useAnnouncementApi = () => {
  const api = useApi();

  /**
   * Create announcement
   * POST /announcement
   * Admin: GLOBAL
   * Pengajar: KELAS
   */
  const createAnnouncement = async (
    data: CreateAnnouncementRequest
  ): Promise<ApiResponse<Announcement>> => {
    return api.post<ApiResponse<Announcement>>("announcement", data);
  };

  /**
   * Get all announcements (filtered by role & enrollment)
   * GET /announcement?page=1&limit=10&search=keyword
   *
   * @param params - Query parameters for pagination and search
   * @param params.page - Page number (default: 1)
   * @param params.limit - Items per page (default: 10, max: 100)
   * @param params.search - Search keyword to filter by title (judul) or content (isi), case-insensitive
   */
  const getAllAnnouncements = async (
    params?: GetAnnouncementsParams
  ): Promise<ApiResponse<AnnouncementPaginatedResponse>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `announcement?${queryString}`
      : "announcement";

    return api.get<ApiResponse<AnnouncementPaginatedResponse>>(endpoint);
  };

  /**
   * Update announcement
   * PATCH /announcement/:id
   * Only creator or admin
   */
  const updateAnnouncement = async (
    id: string,
    data: UpdateAnnouncementRequest
  ): Promise<ApiResponse<Announcement>> => {
    return api.patch<ApiResponse<Announcement>>(`announcement/${id}`, data);
  };

  /**
   * Delete announcement
   * DELETE /announcement/:id
   * Only creator or admin
   */
  const deleteAnnouncement = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`announcement/${id}`);
  };

  return {
    createAnnouncement,
    getAllAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
  };
};
