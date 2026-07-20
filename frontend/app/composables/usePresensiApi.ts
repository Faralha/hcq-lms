import type { ApiResponse } from "~/types/api";
import type {
  User,
  Kelas,
  PresensiSession,
  PresensiRecord,
} from "~/types/entities";

export type { PresensiSession, PresensiRecord } from "~/types/entities";

/**
 * Presensi API Wrapper
 */

export interface StartKelasResponse {
  message: string;
  kode: string;
  expiresAt: string;
  session: PresensiSession;
}

export interface HadirRequest {
  kodePresensi: string;
}

export interface ManualPresensiRequest {
  pelajarId: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALFA";
}

export interface PresensiSessionDetail {
  id: string;
  kelasId: string;
  kode: string;
  createdAt: string;
  expiresAt: string;
  kelas: any;
  presensiRecords: PresensiRecord[];
  // Legacy support
  session?: PresensiSession;
  records?: PresensiRecord[];
}

export interface PresensiKelasResponse {
  sessions: Array<{
    id: string;
    kode: string;
    tanggal: string;
    isActive: boolean;
    records: PresensiRecord[];
  }>;
}

export const usePresensiApi = () => {
  const api = useApi();

  /**
   * Start kelas & generate code (Pengajar only)
   * POST /presensi/kelas/:kelasId/mulai
   */
  const startKelas = async (
    kelasId: string
  ): Promise<ApiResponse<StartKelasResponse>> => {
    return api.post(`presensi/kelas/${kelasId}/mulai`);
  };

  /**
   * Stop presensi session (Pengajar only)
   * POST /presensi/session/:sessionId/stop
   */
  const stopSession = async (
    sessionId: string
  ): Promise<ApiResponse<PresensiSessionDetail>> => {
    return api.post(`presensi/session/${sessionId}/stop`);
  };

  /**
   * Pelajar hadir dengan kode
   * POST /presensi/hadir
   */
  const hadirDenganKode = async (
    data: HadirRequest
  ): Promise<ApiResponse<{ message: string; record: PresensiRecord }>> => {
    return api.post(`presensi/hadir`, data);
  };

  /**
   * Manual presensi (Pengajar only)
   * POST /presensi/session/:sessionId/manual
   */
  const manualPresensi = async (
    sessionId: string,
    data: ManualPresensiRequest
  ): Promise<ApiResponse<PresensiRecord>> => {
    return api.post(
      `presensi/session/${sessionId}/manual`,
      data
    );
  };

  /**
   * Get presensi by session (Pengajar/Admin)
   * GET /presensi/session/:sessionId
   */
  const getPresensiBySession = async (
    sessionId: string
  ): Promise<ApiResponse<PresensiSessionDetail>> => {
    return api.get(`presensi/session/${sessionId}`);
  };

  /**
   * Get riwayat presensi (Pelajar)
   * GET /presensi/riwayat
   */
  const getRiwayatPresensi = async (): Promise<
    ApiResponse<PresensiRecord[]>
  > => {
    return api.get("presensi/riwayat");
  };

  /**
   * Get riwayat presensi by Kelas (Pelajar)
   * GET /presensi/riwayat/:kelasId
   */
  const getRiwayatPresensiByKelas = async (
    kelasId: string
  ): Promise<
    ApiResponse<PresensiRecord[]>
  > => {
    return api.get(`presensi/riwayat/${kelasId}`);
  };

  /**
   * Get presensi sessions by kelas (Pengajar/Admin)
   * GET /presensi/kelas/:kelasId
   * Returns all presensi sessions with their records for a specific kelas
   */
  const getPresensiByKelas = async (
    kelasId: string
  ): Promise<ApiResponse<PresensiKelasResponse>> => {
    return api.get(`presensi/kelas/${kelasId}`);
  };

  return {
    startKelas,
    stopSession,
    hadirDenganKode,
    manualPresensi,
    getPresensiBySession,
    getRiwayatPresensi,
    getRiwayatPresensiByKelas,
    getPresensiByKelas,
  };
};
