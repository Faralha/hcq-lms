import type { ApiResponse } from '~/types/api'

/**
 * SPP API Wrapper
 */

export interface Spp {
  id: string
  userId: string
  nominal: number
  bulan: string
  tahun: number
  status: 'LUNAS' | 'BELUM_LUNAS'
  createdAt: string
  user?: {
    id: string
    email: string
    nama: string
    role: string
  }
}

export interface CreateSppRequest {
  userId: string
  nominal: number
  bulan: string
  tahun: number
  status?: 'LUNAS' | 'BELUM_LUNAS'
}

export interface UpdateSppRequest {
  status?: 'LUNAS' | 'BELUM_LUNAS'
  nominal?: number
}

export const useSppApi = () => {
  const api = useApi()

  /**
   * Create tagihan SPP (Admin only)
   * POST /spp
   */
  const createSpp = async (data: CreateSppRequest): Promise<Spp> => {
    return api.post<Spp>('spp', data)
  }

  /**
   * Get all tagihan SPP (Admin only)
   * GET /spp
   */
  const getAllSpp = async (): Promise<Spp[]> => {
    return api.get<Spp[]>('spp')
  }

  /**
   * Get tagihan by pelajar (Admin only)
   * GET /spp/pelajar/:pelajarId
   */
  const getSppByPelajar = async (pelajarId: string): Promise<Spp[]> => {
    return api.get<Spp[]>(`spp/pelajar/${pelajarId}`)
  }

  /**
   * Get my tagihan SPP (Pelajar)
   * GET /spp/saya
   */
  const getMySpp = async (): Promise<Spp[]> => {
    return api.get<Spp[]>('spp/saya')
  }

  /**
   * Update tagihan SPP (Admin only)
   * PATCH /spp/:id
   */
  const updateSpp = async (id: string, data: UpdateSppRequest): Promise<Spp> => {
    return api.patch<Spp>(`spp/${id}`, data)
  }

  /**
   * Delete tagihan SPP (Admin only)
   * DELETE /spp/:id
   */
  const deleteSpp = async (id: string): Promise<void> => {
    return api.delete(`spp/${id}`)
  }

  return {
    createSpp,
    getAllSpp,
    getSppByPelajar,
    getMySpp,
    updateSpp,
    deleteSpp,
  }
}
