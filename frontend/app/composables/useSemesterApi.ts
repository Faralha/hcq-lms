import type { ApiResponse } from '~/types/api'

/**
 * Semester API Wrapper
 */

export interface Semester {
  id: string
  nama: string
  tanggalMulai: string
  tanggalAkhir: string
  status: 'AKTIF' | 'MENDATANG' | 'SELESAI'
}

export interface CreateSemesterRequest {
  nama: string
  tanggalMulai: string
  tanggalAkhir: string
  status: 'AKTIF' | 'MENDATANG' | 'SELESAI'
}

export interface UpdateSemesterRequest {
  nama?: string
  tanggalMulai?: string
  tanggalAkhir?: string
  status?: 'AKTIF' | 'MENDATANG' | 'SELESAI'
}

export const useSemesterApi = () => {
  const api = useApi()

  /**
   * Get all semesters
   * GET /semesters
   */
  const getAllSemesters = async (): Promise<Semester[]> => {
    return api.get<Semester[]>('semesters')
  }

  /**
   * Create semester (Admin only)
   * POST /semesters
   */
  const createSemester = async (data: CreateSemesterRequest): Promise<Semester> => {
    return api.post<Semester>('semesters', data)
  }

  /**
   * Update semester (Admin only)
   * PATCH /semesters/:id
   */
  const updateSemester = async (id: string, data: UpdateSemesterRequest): Promise<Semester> => {
    return api.patch<Semester>(`semesters/${id}`, data)
  }

  /**
   * Delete semester (Admin only)
   * DELETE /semesters/:id
   */
  const deleteSemester = async (id: string): Promise<void> => {
    return api.delete(`semesters/${id}`)
  }

  return {
    getAllSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
  }
}
