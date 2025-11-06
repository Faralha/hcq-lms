import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthUser
} from '~/types/auth'
import type { ApiResponse } from '~/types/api'

/**
 * Auth API wrapper
 * Handles all authentication-related API calls
 */
export const useAuthApi = () => {
  const api = useApi()

  /**
   * Login user
   * POST /v1/auth/login
   */
  const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return api.post<LoginResponse>('auth/login', credentials)
  }

  /**
   * Register new user
   * POST /v1/auth/register
   */
  const register = async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    return api.post<RegisterResponse>('auth/register', data)
  }

  /**
   * Logout current user
   * POST /v1/auth/logout
   * Note: Refresh token is sent automatically via httpOnly cookie
   */
  const logout = async (): Promise<ApiResponse<LogoutResponse>> => {
    return api.post<LogoutResponse>('auth/logout')
  }

  /**
   * Get current authenticated user
   * GET /v1/auth/me
   * Requires: Access token in Authorization header
   */
  const getCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
    return api.get<AuthUser>('auth/me')
  }

  /**
   * Refresh authentication token
   * POST /v1/auth/refresh
   * Note: Refresh token is sent automatically via httpOnly cookie
   * Returns new accessToken and refreshToken
   */
  const refreshToken = async (): Promise<ApiResponse<LoginResponse>> => {
    return api.post<LoginResponse>('auth/refresh')
  }

  /**
   * Request password reset
   * POST /v1/auth/forgot-password
   */
  const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return api.post('auth/forgot-password', data)
  }

  /**
   * Reset password with token
   * POST /v1/auth/reset-password
   */
  const resetPassword = async (data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return api.post('auth/reset-password', data)
  }

  /**
   * Verify email with token
   * POST /v1/auth/verify-email
   */
  const verifyEmail = async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post('auth/verify-email', { token })
  }

  /**
   * Resend email verification
   * POST /v1/auth/resend-verification
   */
  const resendVerification = async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post('auth/resend-verification', { email })
  }

  /**
   * Invite pengajar (Admin only)
   * POST /v1/auth/invite-pengajar
   */
  const invitePengajar = async (email: string): Promise<ApiResponse<{ message: string; email: string; magicLink: string; expiresAt: string }>> => {
    return api.post('auth/invite-pengajar', { email })
  }

  /**
   * Change password
   * PATCH /v1/auth/change-password
   */
  const changePassword = async (oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    return api.patch('auth/change-password', { oldPassword, newPassword })
  }

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
    changePassword,
  }
}
