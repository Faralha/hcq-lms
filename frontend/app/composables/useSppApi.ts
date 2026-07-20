import type { ApiResponse } from "~/types/api";
import type { Spp } from "~/types/entities";

export type { Spp } from "~/types/entities";

/**
 * SPP API Wrapper
 */

export interface CreateSppRequest {
  userId: string;
  nominal: number;
  bulan: string;
  tahun: number;
  status?: "LUNAS" | "BELUM_LUNAS";
}

export interface UpdateSppRequest {
  status?: "LUNAS" | "BELUM_LUNAS";
  nominal?: number;
}

export const useSppApi = () => {
  const api = useApi();

  /**
   * Create tagihan SPP (Admin only)
   * POST /spp
   */
  const createSpp = async (
    data: CreateSppRequest
  ): Promise<ApiResponse<Spp>> => {
    return api.post<ApiResponse<Spp>>("spp", data);
  };

  /**
   * Get all tagihan SPP (Admin only)
   * GET /spp
   */
  const getAllSpp = async (): Promise<ApiResponse<Spp[]>> => {
    return api.get<ApiResponse<Spp[]>>("spp");
  };

  /**
   * Get tagihan by pelajar (Admin only)
   * GET /spp/pelajar/:pelajarId
   */
  const getSppByPelajar = async (
    pelajarId: string
  ): Promise<ApiResponse<Spp[]>> => {
    return api.get<ApiResponse<Spp[]>>(`spp/pelajar/${pelajarId}`);
  };

  /**
   * Get my tagihan SPP (Pelajar)
   * GET /spp/saya
   */
  const getMySpp = async (): Promise<ApiResponse<Spp[]>> => {
    return api.get<ApiResponse<Spp[]>>("spp/saya");
  };

  /**
   * Update tagihan SPP (Admin only)
   * PATCH /spp/:id
   */
  const updateSpp = async (
    id: string,
    data: UpdateSppRequest
  ): Promise<ApiResponse<Spp>> => {
    return api.patch<ApiResponse<Spp>>(`spp/${id}`, data);
  };

  /**
   * Delete tagihan SPP (Admin only)
   * DELETE /spp/:id
   */
  const deleteSpp = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`spp/${id}`);
  };

  return {
    createSpp,
    getAllSpp,
    getSppByPelajar,
    getMySpp,
    updateSpp,
    deleteSpp,
  };
};
