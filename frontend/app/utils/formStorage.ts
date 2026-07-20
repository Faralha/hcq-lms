/**
 * Utility for storing and retrieving form data from localStorage
 * Useful for preventing data loss when user accidentally refreshes the page
 */

export interface StoredFormData {
  [key: string]: any
}

/**
 * Save form data to localStorage
 * @param key - Unique key to identify the form
 * @param data - Form data to save
 */
export function saveFormToStorage(key: string, data: StoredFormData): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(data))
    }
  } catch (error) {
    console.error('Failed to save form to localStorage:', error)
  }
}

/**
 * Load form data from localStorage
 * @param key - Unique key to identify the form
 * @returns Stored form data or null if not found
 */
export function loadFormFromStorage<T = StoredFormData>(key: string): T | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    }
    return null
  } catch (error) {
    console.error('Failed to load form from localStorage:', error)
    return null
  }
}

/**
 * Clear form data from localStorage
 * @param key - Unique key to identify the form
 */
export function clearFormFromStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('Failed to clear form from localStorage:', error)
  }
}

/**
 * Composable for form storage with auto-save
 * @param key - Unique key to identify the form
 * @param initialState - Initial form state
 * @param excludeFields - Fields to exclude from storage (e.g., passwords)
 */
export function useFormStorage<T extends StoredFormData>(
  key: string,
  initialState: T,
  excludeFields: string[] = []
) {
  const state = reactive<T>(initialState)

  // Load saved data on mount
  onMounted(() => {
    const saved = loadFormFromStorage<T>(key)
    if (saved) {
      // Restore saved data, but exclude sensitive fields
      Object.keys(saved).forEach((field) => {
        if (!excludeFields.includes(field)) {
          (state as any)[field] = saved[field]
        }
      })
    }
  })

  // Auto-save on state change (debounced)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  watch(
    () => state,
    (newState) => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        // Create copy without excluded fields
        const dataToSave = { ...newState }
        excludeFields.forEach((field) => {
          delete dataToSave[field]
        })
        saveFormToStorage(key, dataToSave)
      }, 500) // Debounce 500ms
    },
    { deep: true }
  )

  // Clear storage
  const clearStorage = () => {
    clearFormFromStorage(key)
  }

  return {
    state,
    clearStorage,
  }
}
