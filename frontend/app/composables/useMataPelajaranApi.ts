import type { ApiResponse } from '~/types/api'

/**
 * Mata Pelajaran API Wrapper
 */

export interface MataPelajaran {
  id: string
  nama: string
  kode: string
  deskripsi?: string
}

export interface CreateMataPelajaranRequest {
  nama: string
  kode: string
  deskripsi?: string
}

export interface UpdateMataPelajaranRequest {
  nama?: string
  kode?: string
  deskripsi?: string
}

export const useMataPelajaranApi = () => {
  const api = useApi()

  /**
   * Get all mata pelajaran
   * GET /mata-pelajaran
   */
  const getAllMataPelajaran = async (): Promise<MataPelajaran[]> => {
    return api.get<MataPelajaran[]>('mata-pelajaran')
  }

  /**
   * Create mata pelajaran (Admin only)
   * POST /mata-pelajaran
   */
  const createMataPelajaran = async (data: CreateMataPelajaranRequest): Promise<MataPelajaran> => {
    return api.post<MataPelajaran>('mata-pelajaran', data)
  }

  /**
   * Update mata pelajaran (Admin only)
   * PATCH /mata-pelajaran/:id
   */
  const updateMataPelajaran = async (id: string, data: UpdateMataPelajaranRequest): Promise<MataPelajaran> => {
    return api.patch<MataPelajaran>(`mata-pelajaran/${id}`, data)
  }

  /**
   * Delete mata pelajaran (Admin only)
   * DELETE /mata-pelajaran/:id
   */
  const deleteMataPelajaran = async (id: string): Promise<void> => {
    return api.delete(`mata-pelajaran/${id}`)
  }

  return {
    getAllMataPelajaran,
    createMataPelajaran,
    updateMataPelajaran,
    deleteMataPelajaran,
  }
}
