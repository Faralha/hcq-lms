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
  const createSection = async (data: CreateSectionRequest): Promise<MateriSection> => {
    return api.post<MateriSection>('materi/section', data)
  }

  /**
   * Get sections by kelas
   * GET /materi/section/kelas/:kelasId
   */
  const getSectionsByKelas = async (kelasId: string): Promise<MateriSection[]> => {
    return api.get<MateriSection[]>(`materi/section/kelas/${kelasId}`)
  }

  /**
   * Update section (Pengajar only)
   * PATCH /materi/section/:id
   */
  const updateSection = async (id: string, data: UpdateSectionRequest): Promise<MateriSection> => {
    return api.patch<MateriSection>(`materi/section/${id}`, data)
  }

  /**
   * Delete section (Pengajar only)
   * DELETE /materi/section/:id
   */
  const deleteSection = async (id: string): Promise<void> => {
    return api.delete(`materi/section/${id}`)
  }

  /**
   * Upload file (Pengajar only)
   * POST /materi/file
   * NOTE: Use FormData for file upload
   */
  const uploadFile = async (materiSectionId: string, file: File): Promise<MateriFile> => {
    const formData = new FormData()
    formData.append('materiSectionId', materiSectionId)
    formData.append('file', file)

    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase as string
    const url = `${apiBase}/v1/materi/file`

    // Get token from useTokens
    const { getAccessToken } = useTokens()
    const token = getAccessToken()

    const response = await $fetch<MateriFile>(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`
      }
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

    // Get token from useTokens
    const { getAccessToken } = useTokens()
    const token = getAccessToken()

    const blob = await $fetch<Blob>(url, {
      method: 'GET',
      credentials: 'include',
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return URL.createObjectURL(blob)
  }

  /**
   * Delete file (Pengajar only)
   * DELETE /materi/file/:id
   */
  const deleteFile = async (id: string): Promise<void> => {
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
