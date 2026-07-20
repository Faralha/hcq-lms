import type { ApiResponse } from "~/types/api";

/**
 * Pengajar Invitation Management API Wrapper
 * Admin only endpoints
 */

export interface PengajarInvitation {
  id: string;
  email: string;
  token: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  status: "PENDING" | "EXPIRED" | "USED";
}

export interface CreateInvitationRequest {
  email: string;
}

export interface ValidateInvitationResponse {
  valid: boolean;
  email: string;
}

export const useInvitationApi = () => {
  const api = useApi();

  /**
   * Get all pengajar invitations (Admin only)
   * GET /auth/invitations
   */
  const getAllInvitations = async (): Promise<
    ApiResponse<PengajarInvitation[]>
  > => {
    return api.get<ApiResponse<PengajarInvitation[]>>("auth/invitations");
  };

  /**
   * Get invitation by ID (Admin only)
   * GET /auth/invitations/:id
   */
  const getInvitationById = async (
    id: string
  ): Promise<ApiResponse<PengajarInvitation>> => {
    return api.get<ApiResponse<PengajarInvitation>>(
      `auth/invitations/${id}`
    );
  };

  /**
   * Create/Invite pengajar (Admin only)
   * POST /auth/invite-pengajar
   */
  const invitePengajar = async (
    data: CreateInvitationRequest
  ): Promise<
    ApiResponse<{ invitation: PengajarInvitation; magicLink: string }>
  > => {
    return api.post<
      ApiResponse<{ invitation: PengajarInvitation; magicLink: string }>
    >("auth/invite-pengajar", data);
  };

  /**
   * Delete invitation (Admin only)
   * DELETE /auth/invitations/:id
   */
  const deleteInvitation = async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`auth/invitations/${id}`);
  };

  /**
   * Resend invitation (Admin only)
   * POST /auth/invitations/:id/resend
   */
  const resendInvitation = async (
    id: string
  ): Promise<ApiResponse<{ magicLink: string }>> => {
    return api.post<ApiResponse<{ magicLink: string }>>(
      `auth/invitations/${id}/resend`
    );
  };

  /**
   * Validate invitation token (Public)
   * GET /auth/validate-invitation?token=xxx
   */
  const validateInvitation = async (
    token: string
  ): Promise<ApiResponse<ValidateInvitationResponse>> => {
    return api.get<ApiResponse<ValidateInvitationResponse>>(
      `auth/validate-invitation?token=${token}`
    );
  };

  return {
    getAllInvitations,
    getInvitationById,
    invitePengajar,
    deleteInvitation,
    resendInvitation,
    validateInvitation,
  };
};
