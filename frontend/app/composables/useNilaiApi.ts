import type { ApiResponse } from "~/types/api";
import type {
  User,
  Kelas,
  Nilai,
  NilaiKomponen as KomponenNilai,
} from "~/types/entities";

/**
 * Nilai API Wrapper
 */

export interface CreateKomponenRequest {
  kelasId: string;
  nama: string;
  bobot: number;
}

export interface EntryNilaiRequest {
  komponenId: string;
  pelajarId: string;
  nilai: number;
}

export interface UpdateNilaiRequest {
  nilai: number;
}

export interface NilaiByKelas {
  kelas: Kelas;
  komponenList: KomponenNilai[];
  pelajarList: Array<{
    user: User;
    nilaiList: Array<{
      komponenId: string;
      nilai: number;
    }>;
  }>;
}

export interface MyNilai {
  kelas: Kelas;
  nilaiList: Nilai[];
}

export const useNilaiApi = () => {
  const api = useApi();

  /**
   * Create komponen nilai (Pengajar only)
   * POST /nilai/komponen
   */
  const createKomponen = async (
    data: CreateKomponenRequest
  ): Promise<ApiResponse<KomponenNilai>> => {
    return api.post("nilai/komponen", data);
  };

  /**
   * Get komponen by kelas
   * GET /nilai/komponen/kelas/:kelasId
   */
  const getKomponenByKelas = async (
    kelasId: string
  ): Promise<ApiResponse<KomponenNilai[]>> => {
    return api.get(`nilai/komponen/kelas/${kelasId}`);
  };

  /**
   * Entry nilai (Pengajar only)
   * POST /nilai/entry
   */
  const entryNilai = async (
    data: EntryNilaiRequest
  ): Promise<ApiResponse<{ message: string; nilai: Nilai }>> => {
    return api.post(`nilai/entry`, data);
  };

  /**
   * Update nilai (Pengajar only)
   * PATCH /nilai/:id
   */
  const updateNilai = async (
    id: string,
    data: UpdateNilaiRequest
  ): Promise<ApiResponse<Nilai>> => {
    return api.patch(`nilai/${id}`, data);
  };

  /**
   * Get nilai by kelas (Pengajar/Admin)
   * GET /nilai/kelas/:kelasId
   */
  const getNilaiByKelas = async (
    kelasId: string
  ): Promise<ApiResponse<NilaiByKelas>> => {
    return api.get(`nilai/kelas/${kelasId}`);
  };

  /**
   * Get my nilai (Pelajar)
   * GET /nilai/saya
   */
  const getMyNilai = async (): Promise<ApiResponse<MyNilai[]>> => {
    return api.get("nilai/saya");
  };

  return {
    createKomponen,
    getKomponenByKelas,
    entryNilai,
    updateNilai,
    getNilaiByKelas,
    getMyNilai,
  };
};
