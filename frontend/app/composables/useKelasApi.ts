import type { ApiResponse } from "~/types/api";
import type { Semester, MataPelajaran, User, Kelas } from "~/types/entities";

export type { Kelas } from "~/types/entities";

/**
 * Kelas & Enrollment API Wrapper
 */

export interface CreateKelasRequest {
  namaKelas: string;
  jadwalHari: string;
  jadwalJam: string;
  semesterId: string;
  mataPelajaranId: string;
}

export interface UpdateKelasRequest {
  namaKelas?: string;
  jadwalHari?: string;
  jadwalJam?: string;
  semesterId?: string;
  mataPelajaranId?: string;
}

export interface EnrollPelajarRequest {
  pelajarId: string;
}

export interface AssignPengajarRequest {
  pengajarId: string;
}

export const useKelasApi = () => {
  const api = useApi();

  /**
   * Get all kelas
   * GET /kelas
   */
  const getAllKelas = async (): Promise<ApiResponse<Kelas[]>> => {
    return api.get<ApiResponse<Kelas[]>>("kelas");
  };

  /**
   * Get kelas by ID
   * GET /kelas/:id
   */
  const getKelasById = async (id: string): Promise<ApiResponse<Kelas>> => {
    return api.get<ApiResponse<Kelas>>(`kelas/${id}`);
  };

  /**
   * Create kelas (Admin only)
   * POST /kelas
   */
  const createKelas = async (
    data: CreateKelasRequest
  ): Promise<ApiResponse<Kelas>> => {
    return api.post<ApiResponse<Kelas>>("kelas", data);
  };

  /**
   * Update kelas (Admin only)
   * PATCH /kelas/:id
   */
  const updateKelas = async (
    id: string,
    data: UpdateKelasRequest
  ): Promise<ApiResponse<Kelas>> => {
    return api.patch<ApiResponse<Kelas>>(`kelas/${id}`, data);
  };

  /**
   * Delete kelas (Admin only)
   * DELETE /kelas/:id
   */
  const deleteKelas = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`kelas/${id}`);
  };

  /**
   * Enroll pelajar to kelas (Admin only)
   * POST /kelas/:kelasId/enroll-pelajar
   */
  const enrollPelajar = async (
    kelasId: string,
    data: EnrollPelajarRequest
  ): Promise<ApiResponse<any>> => {
    return api.post(`kelas/${kelasId}/enroll-pelajar`, data);
  };

  /**
   * Assign pengajar to kelas (Admin only)
   * POST /kelas/:kelasId/assign-pengajar
   */
  const assignPengajar = async (
    kelasId: string,
    data: AssignPengajarRequest
  ): Promise<ApiResponse<any>> => {
    return api.post(`kelas/${kelasId}/assign-pengajar`, data);
  };

  /**
   * Remove user from kelas (Admin only)
   * DELETE /kelas/:kelasId/unenroll/:userId
   */
  const unenrollUser = async (
    kelasId: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    return api.delete(`kelas/${kelasId}/unenroll/${userId}`);
  };

  return {
    getAllKelas,
    getKelasById,
    createKelas,
    updateKelas,
    deleteKelas,
    enrollPelajar,
    assignPengajar,
    unenrollUser,
  };
};
