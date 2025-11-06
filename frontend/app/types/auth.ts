// Role type
export type UserRole = 'ADMIN' | 'PENGAJAR' | 'PELAJAR'

// Auth API Types
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  city: string
  address: string
}

export interface AuthUser {
  id: string
  fullName: string
  nama?: string // Backend might use 'nama' instead of 'fullName'
  email: string
  phoneNumber: string
  city: string
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
