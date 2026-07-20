// API Response Types
export interface ApiResponse<T = any> {
  status: number
  message?: string
  data?: T
  meta?: PaginationMeta
}

export interface ApiError {
  status: number
  message: string
  errors?: any
}

// Pagination Types
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

// Request Config
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  query?: Record<string, any>
  headers?: Record<string, string>
  version?: string // default: 'v1'
}
