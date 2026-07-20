import type { ApiResponse } from "~/types/api";
import type { MataPelajaran } from "~/types/entities";

export type { MataPelajaran } from "~/types/entities";

/**
 * Mata Pelajaran API Wrapper
 */

export interface CreateMataPelajaranRequest {
  nama: string;
  kode: string;
  deskripsi?: string;
}

export interface UpdateMataPelajaranRequest {
  nama?: string;
  kode?: string;
  deskripsi?: string;
}

export const useMataPelajaranApi = () => {
  const api = useApi();

  /**
   * Get all mata pelajaran
   * GET /mata-pelajaran
   */
  const getAllMataPelajaran = async (): Promise<
    ApiResponse<MataPelajaran[]>
  > => {
    return api.get<ApiResponse<MataPelajaran[]>>("mata-pelajaran");
  };

  /**
   * Create mata pelajaran (Admin only)
   * POST /mata-pelajaran
   */
  const createMataPelajaran = async (
    data: CreateMataPelajaranRequest
  ): Promise<ApiResponse<MataPelajaran>> => {
    return api.post<ApiResponse<MataPelajaran>>("mata-pelajaran", data);
  };

  /**
   * Update mata pelajaran (Admin only)
   * PATCH /mata-pelajaran/:id
   */
  const updateMataPelajaran = async (
    id: string,
    data: UpdateMataPelajaranRequest
  ): Promise<ApiResponse<MataPelajaran>> => {
    return api.patch<ApiResponse<MataPelajaran>>(`mata-pelajaran/${id}`, data);
  };

  /**
   * Delete mata pelajaran (Admin only)
   * DELETE /mata-pelajaran/:id
   */
  const deleteMataPelajaran = async (
    id: string
  ): Promise<ApiResponse<void>> => {
    return api.delete(`mata-pelajaran/${id}`);
  };

  return {
    getAllMataPelajaran,
    createMataPelajaran,
    updateMataPelajaran,
    deleteMataPelajaran,
  };
};
