// Role type
export type UserRole = 'ADMIN' | 'PENGAJAR' | 'PELAJAR'

// Auth API Types
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  nama: string
  fullName: string
  email: string
  password: string
  phoneNumber: string
  provinces: string
  cities: string
  address: string
}

export interface AuthUser {
  id: string
  fullName: string
  nama?: string
  email: string
  phoneNumber: string
  cities: string
  address: string
  role?: UserRole
  createdAt?: string
  updatedAt?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RegisterResponse {
  user: AuthUser
  message?: string
}

export interface LogoutResponse {
  message: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface InvitePengajarRequest {
  email: string
}

export interface InvitePengajarResponse {
  message: string
  email: string
  magicLink: string
  expiresAt: string
}

export interface ValidateInvitationResponse {
  valid: boolean
  email: string
  message: string
}
