import type { ApiResponse } from '~/types/api'
import type { User } from './useUserApi'
import type { Kelas } from './useKelasApi'

/**
 * Presensi API Wrapper
 */

export interface PresensiSession {
  id: string
  kode: string
  tanggal: string
  isActive: boolean
  kelas: Kelas
}

export interface PresensiRecord {
  id: string
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA'
  timestamp: string
  user: User
  presensiSession?: PresensiSession
}

export interface StartKelasResponse {
  message: string
  kode: string
  expiresAt: string
  session: PresensiSession
}

export interface HadirRequest {
  kodePresensi: string
}

export interface ManualPresensiRequest {
  pelajarId: string
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA'
}

export interface PresensiSessionDetail {
  session: PresensiSession
  records: PresensiRecord[]
}

export const usePresensiApi = () => {
  const api = useApi()

  /**
   * Start kelas & generate code (Pengajar only)
   * POST /presensi/kelas/:kelasId/mulai
   */
  const startKelas = async (kelasId: string): Promise<ApiResponse<StartKelasResponse>> => {
    return api.post<StartKelasResponse>(`presensi/kelas/${kelasId}/mulai`)
  }

  /**
   * Pelajar hadir dengan kode
   * POST /presensi/hadir
   */
  const hadirDenganKode = async (data: HadirRequest): Promise<ApiResponse<{ message: string; record: PresensiRecord }>> => {
    return api.post(`presensi/hadir`, data)
  }

  /**
   * Manual presensi (Pengajar only)
   * POST /presensi/session/:sessionId/manual
   */
  const manualPresensi = async (sessionId: string, data: ManualPresensiRequest): Promise<ApiResponse<PresensiRecord>> => {
    return api.post<PresensiRecord>(`presensi/session/${sessionId}/manual`, data)
  }

  /**
   * Get presensi by session (Pengajar/Admin)
   * GET /presensi/session/:sessionId
   */
  const getPresensiBySession = async (sessionId: string): Promise<ApiResponse<PresensiSessionDetail>> => {
    return api.get<PresensiSessionDetail>(`presensi/session/${sessionId}`)
  }

  /**
   * Get riwayat presensi (Pelajar)
   * GET /presensi/riwayat
   */
  const getRiwayatPresensi = async (): Promise<ApiResponse<PresensiRecord[]>> => {
    return api.get<PresensiRecord[]>('presensi/riwayat')
  }

  return {
    startKelas,
    hadirDenganKode,
    manualPresensi,
    getPresensiBySession,
    getRiwayatPresensi,
  }
}
