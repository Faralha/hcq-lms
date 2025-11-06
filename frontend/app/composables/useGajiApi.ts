import type { ApiResponse } from '~/types/api'

/**
 * Gaji API Wrapper
 */

export interface Gaji {
  id: string
  userId: string
  nominal: number
  bulan: string
  tahun: number
  status: 'LUNAS' | 'BELUM_LUNAS'
  createdAt: string
}

export interface CreateGajiRequest {
  userId: string
  nominal: number
  bulan: string
  tahun: number
  status: 'LUNAS' | 'BELUM_LUNAS'
}

export interface UpdateGajiRequest {
  status?: 'LUNAS' | 'BELUM_LUNAS'
  nominal?: number
}

export const useGajiApi = () => {
  const api = useApi()

  /**
   * Create gaji (Admin only)
   * POST /gaji
   */
  const createGaji = async (data: CreateGajiRequest): Promise<ApiResponse<Gaji>> => {
    return api.post<Gaji>('gaji', data)
  }

  /**
   * Get all gaji (Admin only)
   * GET /gaji
   */
  const getAllGaji = async (): Promise<ApiResponse<Gaji[]>> => {
    return api.get<Gaji[]>('gaji')
  }

  /**
   * Get gaji by pengajar (Admin only)
   * GET /gaji/pengajar/:pengajarId
   */
  const getGajiByPengajar = async (pengajarId: string): Promise<ApiResponse<Gaji[]>> => {
    return api.get<Gaji[]>(`gaji/pengajar/${pengajarId}`)
  }

  /**
   * Get my gaji (Pengajar)
   * GET /gaji/saya
   */
  const getMyGaji = async (): Promise<ApiResponse<Gaji[]>> => {
    return api.get<Gaji[]>('gaji/saya')
  }

  /**
   * Update gaji (Admin only)
   * PATCH /gaji/:id
   */
  const updateGaji = async (id: string, data: UpdateGajiRequest): Promise<ApiResponse<Gaji>> => {
    return api.patch<Gaji>(`gaji/${id}`, data)
  }

  /**
   * Delete gaji (Admin only)
   * DELETE /gaji/:id
   */
  const deleteGaji = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`gaji/${id}`)
  }

  return {
    createGaji,
    getAllGaji,
    getGajiByPengajar,
    getMyGaji,
    updateGaji,
    deleteGaji,
  }
}
