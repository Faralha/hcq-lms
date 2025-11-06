import type { ApiResponse } from '~/types/api'
import type { User } from './useUserApi'
import type { Kelas } from './useKelasApi'

/**
 * Announcement API Wrapper
 */

export interface Announcement {
  id: string
  judul: string
  isi: string
  scope: 'GLOBAL' | 'KELAS'
  createdBy: string
  kelasId?: string
  createdAt: string
  creator?: User
  kelas?: Kelas
}

export interface CreateAnnouncementRequest {
  judul: string
  isi: string
  scope: 'GLOBAL' | 'KELAS'
  kelasId?: string
}

export interface UpdateAnnouncementRequest {
  judul?: string
  isi?: string
}

export const useAnnouncementApi = () => {
  const api = useApi()

  /**
   * Create announcement
   * POST /announcement
   * Admin: GLOBAL
   * Pengajar: KELAS
   */
  const createAnnouncement = async (data: CreateAnnouncementRequest): Promise<ApiResponse<Announcement>> => {
    return api.post<Announcement>('announcement', data)
  }

  /**
   * Get all announcements (filtered by role & enrollment)
   * GET /announcement
   */
  const getAllAnnouncements = async (): Promise<ApiResponse<Announcement[]>> => {
    return api.get<Announcement[]>('announcement')
  }

  /**
   * Update announcement
   * PATCH /announcement/:id
   * Only creator or admin
   */
  const updateAnnouncement = async (id: string, data: UpdateAnnouncementRequest): Promise<ApiResponse<Announcement>> => {
    return api.patch<Announcement>(`announcement/${id}`, data)
  }

  /**
   * Delete announcement
   * DELETE /announcement/:id
   * Only creator or admin
   */
  const deleteAnnouncement = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`announcement/${id}`)
  }

  return {
    createAnnouncement,
    getAllAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
  }
}
