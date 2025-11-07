import type { ApiResponse } from '~/types/api'

/**
 * User Management API Wrapper
 * Admin only endpoints
 */

export interface User {
  id: string
  email: string
  nama: string
  fullName?: string
  cities?: string
  address?: string
  phoneNumber?: string
  role: 'ADMIN' | 'PENGAJAR' | 'PELAJAR'
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  nama: string
  role: 'ADMIN' | 'PENGAJAR' | 'PELAJAR'
  fullName?: string
  cities?: string
  address?: string
  phoneNumber?: string
}

export interface UpdateUserRequest {
  nama?: string
  email?: string
  fullName?: string
  cities?: string
  address?: string
  phoneNumber?: string
}

export const useUserApi = () => {
  const api = useApi()

  /**
   * Get all users (Admin only)
   * GET /users
   */
  const getAllUsers = async (): Promise<User[]> => {
    return api.get<User[]>('users')
  }

  /**
   * Create user (Admin only)
   * POST /users
   */
  const createUser = async (data: CreateUserRequest): Promise<User> => {
    return api.post<User>('users', data)
  }

  /**
   * Update user (Admin only)
   * PATCH /users/:id
   */
  const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
    return api.patch<User>(`users/${id}`, data)
  }

  /**
   * Delete user (Admin only)
   * DELETE /users/:id
   */
  const deleteUser = async (id: string): Promise<void> => {
    return api.delete(`users/${id}`)
  }

  return {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
