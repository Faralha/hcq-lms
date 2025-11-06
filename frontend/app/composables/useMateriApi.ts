import type { ApiResponse } from '~/types/api'
import type { Kelas } from './useKelasApi'

/**
 * Materi & File Upload API Wrapper
 */

export interface MateriFile {
  id: string
  judul: string
  filename: string
  filepath: string
  mimetype: string
  size: number
  createdAt: string
}

export interface MateriSection {
  id: string
  kelasId: string
  judul: string
  deskripsi?: string
  urutan: number
  createdBy: string
  createdAt: string
  kelas?: Kelas
  files?: MateriFile[]
}

export interface CreateSectionRequest {
  kelasId: string
  judul: string
  deskripsi?: string
}

export interface UpdateSectionRequest {
  judul?: string
  deskripsi?: string
}

export const useMateriApi = () => {
  const api = useApi()

  /**
   * Create materi section (Pengajar only)
   * POST /materi/section
   */
  const createSection = async (data: CreateSectionRequest): Promise<ApiResponse<MateriSection>> => {
    return api.post<MateriSection>('materi/section', data)
  }

  /**
   * Get sections by kelas
   * GET /materi/section/kelas/:kelasId
   */
  const getSectionsByKelas = async (kelasId: string): Promise<ApiResponse<MateriSection[]>> => {
    return api.get<MateriSection[]>(`materi/section/kelas/${kelasId}`)
  }

  /**
   * Update section (Pengajar only)
   * PATCH /materi/section/:id
   */
  const updateSection = async (id: string, data: UpdateSectionRequest): Promise<ApiResponse<MateriSection>> => {
    return api.patch<MateriSection>(`materi/section/${id}`, data)
  }

  /**
   * Delete section (Pengajar only)
   * DELETE /materi/section/:id
   */
  const deleteSection = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`materi/section/${id}`)
  }

  /**
   * Upload file (Pengajar only)
   * POST /materi/file
   * NOTE: Use FormData for file upload
   */
  const uploadFile = async (materiSectionId: string, file: File): Promise<ApiResponse<MateriFile>> => {
    const formData = new FormData()
    formData.append('materiSectionId', materiSectionId)
    formData.append('file', file)

    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase as string
    const url = `${apiBase}/v1/materi/file`

    const response = await $fetch<ApiResponse<MateriFile>>(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    return response
  }

  /**
   * Download file
   * GET /materi/file/download/:id
   * Returns blob URL
   */
  const downloadFile = async (id: string): Promise<string> => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase as string
    const url = `${apiBase}/v1/materi/file/download/${id}`

    const blob = await $fetch<Blob>(url, {
      method: 'GET',
      credentials: 'include',
      responseType: 'blob',
    })

    return URL.createObjectURL(blob)
  }

  /**
   * Delete file (Pengajar only)
   * DELETE /materi/file/:id
   */
  const deleteFile = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`materi/file/${id}`)
  }

  return {
    createSection,
    getSectionsByKelas,
    updateSection,
    deleteSection,
    uploadFile,
    downloadFile,
    deleteFile,
  }
}
