import { useApi } from "./useApi";
import type { ApiResponse } from "~/types/api";
import type { User, Semester } from "~/types/entities";

/**
 * Rapor API Wrapper
 */

export interface RaporFile {
  id: string;
  studentId: string;
  semesterId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  semester?: Semester;
}

export interface GenerateRaporResponse {
  raporFileId: string;
  status: string;
  message: string;
}

export const useRaporApi = () => {
  const api = useApi();

  /**
   * Generate rapor PDF for a student in a specific semester (Admin only)
   * POST /rapor/generate/:studentId?semesterId=xxx
   */
  const generateRapor = async (
    studentId: string,
    semesterId: string
  ): Promise<ApiResponse<GenerateRaporResponse>> => {
    return api.post(`rapor/generate/${studentId}?semesterId=${semesterId}`);
  };

  /**
   * Get rapor generation status
   * GET /rapor/status/:raporFileId
   */
  const getRaporStatus = async (
    raporFileId: string
  ): Promise<ApiResponse<RaporFile>> => {
    return api.get(`rapor/status/${raporFileId}`);
  };

  /**
   * Download rapor PDF file
   * Returns a URL string that can be used to download the file
   * GET /rapor/download/:raporFileId
   */
  const downloadRapor = async (raporFileId: string): Promise<string> => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase as string;
    const url = `${apiBase}/v1/rapor/download/${raporFileId}`;

    // Get token from useTokens
    const { getAccessToken } = useTokens();
    const token = getAccessToken();

    const blob = await $fetch<Blob>(url, {
      method: "GET",
      credentials: "include",
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return URL.createObjectURL(blob);
  };

  /**
   * Get all rapor files for the authenticated user (Students)
   * GET /rapor/my-files
   */
  const getMyRaporFiles = async (): Promise<ApiResponse<RaporFile[]>> => {
    return api.get("rapor/my-files");
  };

  /**
   * Get all rapor files for a specific student (Admin/Pengajar)
   * GET /rapor/student/:studentId
   */
  const getRaporFilesByStudent = async (
    studentId: string
  ): Promise<ApiResponse<RaporFile[]>> => {
    return api.get(`rapor/student/${studentId}`);
  };

  /**
   * Get all rapor files in the system (Admin only)
   * GET /rapor/all
   */
  const getAllRaporFiles = async (): Promise<ApiResponse<RaporFile[]>> => {
    return api.get("rapor/all");
  };

  return {
    generateRapor,
    getRaporStatus,
    downloadRapor,
    getMyRaporFiles,
    getRaporFilesByStudent,
    getAllRaporFiles,
  };
};
