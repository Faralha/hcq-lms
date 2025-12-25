import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthUser,
  InvitePengajarRequest,
  InvitePengajarResponse,
  ValidateInvitationResponse,
} from "~/types/auth";
import type { ApiResponse } from "~/types/api";

/**
 * Auth API wrapper
 * Handles all authentication-related API calls
 */
export const useAuthApi = () => {
  const api = useApi();

  /**
   * Login user
   * POST /v1/auth/login
   */
  const login = async (
    credentials: LoginRequest
  ): Promise<ApiResponse<LoginResponse>> => {
    return api.post<ApiResponse<LoginResponse>>("auth/login", credentials);
  };

  /**
   * Register new user
   * POST /v1/auth/register (without token - PELAJAR)
   * POST /v1/auth/register?token=xxx (with token - PENGAJAR)
   */
  const register = async (
    data: RegisterRequest,
    token?: string
  ): Promise<ApiResponse<RegisterResponse>> => {
    const endpoint = token ? `auth/register?token=${token}` : "auth/register";
    return api.post<ApiResponse<RegisterResponse>>(endpoint, data);
  };

  /**
   * Logout current user
   * POST /v1/auth/logout
   * Note: Refresh token is sent automatically via httpOnly cookie
   */
  const logout = async (): Promise<ApiResponse<LogoutResponse>> => {
    return api.post<ApiResponse<LogoutResponse>>("auth/logout");
  };

  /**
   * Get current authenticated user
   * GET /v1/auth/me
   * Requires: Access token in Authorization header
   */
  const getCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
    return api.get<ApiResponse<AuthUser>>("auth/me");
  };

  /**
   * Refresh authentication token
   * POST /v1/auth/refresh
   * Note: Refresh token is sent automatically via httpOnly cookie
   * Returns new accessToken and refreshToken
   */
  const refreshToken = async (): Promise<ApiResponse<LoginResponse>> => {
    return api.post<ApiResponse<LoginResponse>>("auth/refresh");
  };

  /**
   * Request password reset
   * POST /v1/auth/forgot-password
   */
  const forgotPassword = async (
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> => {
    return api.post<ApiResponse<{ message: string }>>(
      "auth/forgot-password",
      data
    );
  };

  /**
   * Reset password with token
   * POST /v1/auth/reset-password
   */
  const resetPassword = async (
    data: ResetPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> => {
    return api.post<ApiResponse<{ message: string }>>(
      "auth/reset-password",
      data
    );
  };

  /**
   * Verify email with token
   * POST /v1/auth/verify-email
   */
  const verifyEmail = async (
    token: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return api.post<ApiResponse<{ message: string }>>("auth/verify-email", {
      token,
    });
  };

  /**
   * Resend email verification
   * POST /v1/auth/resend-verification
   */
  const resendVerification = async (
    email: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return api.post<ApiResponse<{ message: string }>>(
      "auth/resend-verification",
      { email }
    );
  };

  /**
   * Invite pengajar (Admin only)
   * POST /v1/auth/invite-pengajar
   *
   * @param email - Email address of the teacher to invite
   * @returns Promise with invitation details including magic link
   *
   * @example
   * const { invitePengajar } = useAuthApi()
   * const response = await invitePengajar('teacher@hcq.com')
   * console.log(response.magicLink) // Share this link with the teacher
   */
  const invitePengajar = async (
    email: string
  ): Promise<ApiResponse<InvitePengajarResponse>> => {
    return api.post<ApiResponse<InvitePengajarResponse>>(
      "auth/invite-pengajar",
      { email }
    );
  };

  /**
   * Validate pengajar invitation token
   * GET /v1/auth/validate-invitation?token=xxx
   *
   * @param token - The invitation token from the magic link
   * @returns Promise with validation status and email
   *
   * @example
   * const { validateInvitation } = useAuthApi()
   * const response = await validateInvitation('abc123def456...')
   * if (response.valid) {
   *   console.log('Token valid for email:', response.email)
   * }
   */
  const validateInvitation = async (
    token: string
  ): Promise<ApiResponse<ValidateInvitationResponse>> => {
    return api.get<ApiResponse<ValidateInvitationResponse>>(
      `auth/validate-invitation?token=${token}`
    );
  };

  /**
   * Change password
   * PATCH /v1/auth/change-password
   */
  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return api.patch("auth/change-password", { oldPassword, newPassword });
  };

  return {
    login,
    register,
    logout,
    getCurrentUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    invitePengajar,
    validateInvitation,
    changePassword,
  };
};
