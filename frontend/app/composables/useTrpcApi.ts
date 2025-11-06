import type { ApiResponse } from '~/types/api'

/**
 * TRPC API wrapper
 * Untuk berkomunikasi dengan TRPC server di http://localhost:3000/api/v1/trpc
 */
export const useTrpcApi = () => {
  const api = useApi()

  /**
   * TRPC Query
   * @param procedure - TRPC procedure name (e.g., 'user.getById')
   * @param input - Input parameters
   */
  const query = async <T = any>(
    procedure: string,
    input?: any
  ): Promise<ApiResponse<T>> => {
    return api.get<T>(`trpc/${procedure}`, {
      query: input ? { input: JSON.stringify(input) } : undefined
    })
  }

  /**
   * TRPC Mutation
   * @param procedure - TRPC procedure name (e.g., 'user.create')
   * @param input - Input parameters
   */
  const mutate = async <T = any>(
    procedure: string,
    input?: any
  ): Promise<ApiResponse<T>> => {
    return api.post<T>(`trpc/${procedure}`, input)
  }

  /**
   * TRPC Batch Query
   * Execute multiple queries at once
   */
  const batchQuery = async <T = any>(
    queries: Array<{ procedure: string; input?: any }>
  ): Promise<ApiResponse<T[]>> => {
    const batch = queries.map(q => ({
      procedure: q.procedure,
      input: q.input
    }))

    return api.post<T[]>('trpc/batch', { queries: batch })
  }

  return {
    query,
    mutate,
    batchQuery,
  }
}
