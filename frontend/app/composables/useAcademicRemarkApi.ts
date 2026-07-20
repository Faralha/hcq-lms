import type { ApiResponse } from "~/types/api";
import type { AcademicRemark } from "~/types/entities";

export type { AcademicRemark } from "~/types/entities";

/**
 * Academic Remark API Wrapper
 * Pengajar and Admin endpoints
 */

export interface CreateAcademicRemarkRequest {
  userId: string;
  kelasId: string;
  semesterId: string;
  catatan: string;
}

export interface UpdateAcademicRemarkRequest {
  catatan: string;
}

export const useAcademicRemarkApi = () => {
  const api = useApi();

  /**
   * Create academic remark (Pengajar only)
   * POST /academic-remark
   */
  const createAcademicRemark = async (
    data: CreateAcademicRemarkRequest
  ): Promise<ApiResponse<AcademicRemark>> => {
    return api.post<ApiResponse<AcademicRemark>>("academic-remark", data);
  };

  /**
   * Get academic remarks by kelas (Pengajar/Admin)
   * GET /academic-remark/kelas/:kelasId
   */
  const getAcademicRemarksByKelas = async (
    kelasId: string
  ): Promise<ApiResponse<AcademicRemark[]>> => {
    return api.get<ApiResponse<AcademicRemark[]>>(
      `academic-remark/kelas/${kelasId}`
    );
  };

  /**
   * Get my academic remarks (Pelajar)
   * GET /academic-remark/saya
   */
  const getMyAcademicRemarks =
    async (): Promise<ApiResponse<AcademicRemark[]>> => {
      return api.get<ApiResponse<AcademicRemark[]>>("academic-remark/saya");
    };

  /**
   * Get academic remark by ID
   * GET /academic-remark/:id
   */
  const getAcademicRemarkById = async (
    id: string
  ): Promise<ApiResponse<AcademicRemark>> => {
    return api.get<ApiResponse<AcademicRemark>>(`academic-remark/${id}`);
  };

  /**
   * Update academic remark (Pengajar only)
   * PATCH /academic-remark/:id
   */
  const updateAcademicRemark = async (
    id: string,
    data: UpdateAcademicRemarkRequest
  ): Promise<ApiResponse<AcademicRemark>> => {
    return api.patch<ApiResponse<AcademicRemark>>(
      `academic-remark/${id}`,
      data
    );
  };

  /**
   * Delete academic remark (Pengajar only)
   * DELETE /academic-remark/:id
   */
  const deleteAcademicRemark = async (
    id: string
  ): Promise<ApiResponse<AcademicRemark>> => {
    return api.delete<ApiResponse<AcademicRemark>>(`academic-remark/${id}`);
  };

  return {
    createAcademicRemark,
    getAcademicRemarksByKelas,
    getMyAcademicRemarks,
    getAcademicRemarkById,
    updateAcademicRemark,
    deleteAcademicRemark,
  };
};
