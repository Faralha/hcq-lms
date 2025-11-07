import type { ApiRequestConfig, ApiResponse, ApiError } from '~/types/api'

/**
 * Global API wrapper untuk komunikasi dengan backend
 * Menggunakan $fetch dari Nuxt dengan konfigurasi default
 * Supports JWT Access Token (sessionStorage) + Refresh Token (httpOnly cookie)
 */
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { getAccessToken } = useTokens()

  /**
   * Make API request
   * @param endpoint - API endpoint (e.g., 'login', 'users', 'auth/me')
   * @param options - Request configuration
   */
  const request = async <T = any>(
    endpoint: string,
    options: ApiRequestConfig = {}
  ): Promise<T> => {
    const {
      method = 'GET',
      body,
      query,
      headers = {},
      version = 'v1'
    } = options

    // Clean endpoint (remove leading slash)
    const cleanEndpoint = endpoint.replace(/^\//, '')
    
    // Build full URL
    // Expected: http://localhost:4000/api/v1/login
    const url = `${apiBase}/${version}/${cleanEndpoint}`

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    // Add Authorization header if access token exists
    // Only on client-side (sessionStorage only available in browser)
    const accessToken = import.meta.client ? getAccessToken() : null
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`
    }

    console.log(`[API] ${method} ${url}`, body ? { body } : '')
    console.log(`[API] Running on:`, import.meta.client ? 'CLIENT' : 'SERVER')
    if (accessToken) {
      console.log(`[API] Using Access Token: ${accessToken.substring(0, 20)}...`)
    }

    try {
      // Use $fetch with proper configuration
      const fetchOptions: any = {
        method,
        headers: requestHeaders,
        credentials: 'include', // Always include credentials for cookies
      }

      // Add body if present
      if (body !== undefined) {
        fetchOptions.body = body
      }

      // Add query if present
      if (query !== undefined) {
        fetchOptions.query = query
      }

      const response = await $fetch<any>(url, fetchOptions)

      console.log(`[API] Response from ${url}:`, response)

      // Return response as-is from backend
      return response
    } catch (error: any) {
      console.error(`[API] Error from ${url}:`, error)
      
      // Handle 401 Unauthorized - Try to refresh token (CLIENT-SIDE ONLY)
      if (import.meta.client && error?.statusCode === 401 && endpoint !== 'auth/refresh' && endpoint !== 'auth/login') {
        console.log('[API] 401 Unauthorized - Attempting token refresh')
        console.log('[API] Current cookies:', document.cookie) // Debug: check cookies
        
        try {
          // Try to refresh token
          const { setAccessToken } = useTokens()
          
          console.log('[API] Calling refresh endpoint...')
          const refreshResponse = await $fetch<any>(`${apiBase}/${version}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Send refresh token cookie
            headers: {
              'Content-Type': 'application/json',
            },
          })

          console.log('[API] Refresh response:', refreshResponse)

          // Check for accessToken in various response formats
          const newAccessToken = refreshResponse?.accessToken || refreshResponse?.data?.accessToken
          
          if (newAccessToken) {
            console.log('[API] Token refreshed successfully')
            
            // Save new access token
            setAccessToken(newAccessToken)
            
            // Retry original request with new token
            requestHeaders['Authorization'] = `Bearer ${newAccessToken}`
            
            console.log('[API] Retrying original request with new token')
            const retryResponse = await $fetch<any>(url, {
              method,
              body: body !== undefined ? body : undefined,
              query: query !== undefined ? query : undefined,
              headers: requestHeaders,
              credentials: 'include',
            })
            
            return retryResponse
          } else {
            console.error('[API] No access token in refresh response')
            throw new Error('No access token received from refresh endpoint')
          }
        } catch (refreshError: any) {
          console.error('[API] Token refresh failed:', refreshError)
          console.error('[API] Refresh error status:', refreshError?.statusCode)
          console.error('[API] Refresh error data:', refreshError?.data)
          
          // Clear tokens and redirect to login
          const { clearTokens } = useTokens()
          clearTokens()
          
          console.log('[API] Redirecting to login page...')
          navigateTo('/auth/login')
          
          throw refreshError
        }
      }
      
      // Handle API errors
      const apiError: ApiError = {
        statusCode: error?.statusCode || error?.response?.status || 500,
        message: error?.data?.message || error?.message || 'An error occurred',
        errors: error?.data?.errors || undefined,
      }

      // Re-throw as structured error
      throw apiError
    }
  }

  /**
   * GET request
   */
  const get = <T = any>(endpoint: string, options: Omit<ApiRequestConfig, 'method' | 'body'> = {}) => {
    return request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  const post = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, 'method' | 'body'> = {}) => {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  const put = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, 'method' | 'body'> = {}) => {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH request
   */
  const patch = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, 'method' | 'body'> = {}) => {
    return request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE request
   */
  const del = <T = any>(endpoint: string, options: Omit<ApiRequestConfig, 'method' | 'body'> = {}) => {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  }
}
