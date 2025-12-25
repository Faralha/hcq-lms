import { getRegencies, getProvinces } from 'idn-area-data'

export interface Regency {
  code: string
  name: string
  provinceCode: string
}

export interface Province {
  code: string
  name: string
}

/**
 * Get all regencies (kabupaten/kota) in Indonesia
 * @returns Promise<Regency[]>
 */
export async function getIndonesianRegencies(): Promise<Regency[]> {
  try {
    const regenciesData = await getRegencies({ transform: true })
    return regenciesData.map((r: any) => ({
      code: r.code,
      name: r.name,
      provinceCode: r.provinceCode
    }))
  } catch (error) {
    console.error('Failed to load regencies data:', error)
    // Fallback to default cities in Banten province
    return [
      { code: '36.01', name: 'KABUPATEN PANDEGLANG', provinceCode: '36' },
      { code: '36.02', name: 'KABUPATEN LEBAK', provinceCode: '36' },
      { code: '36.03', name: 'KABUPATEN TANGERANG', provinceCode: '36' },
      { code: '36.04', name: 'KABUPATEN SERANG', provinceCode: '36' },
      { code: '36.71', name: 'KOTA TANGERANG', provinceCode: '36' },
      { code: '36.72', name: 'KOTA CILEGON', provinceCode: '36' },
      { code: '36.73', name: 'KOTA SERANG', provinceCode: '36' },
      { code: '36.74', name: 'KOTA TANGERANG SELATAN', provinceCode: '36' }
    ]
  }
}

/**
 * Get all provinces in Indonesia
 * @returns Promise<Province[]>
 */
export async function getIndonesianProvinces(): Promise<Province[]> {
  try {
    const provincesData = await getProvinces()
    return provincesData.map((p: any) => ({
      code: p.code,
      name: p.name
    }))
  } catch (error) {
    console.error('Failed to load provinces data:', error)
    // Fallback to some major provinces
    return [
      { code: '11', name: 'ACEH' },
      { code: '12', name: 'SUMATERA UTARA' },
      { code: '31', name: 'DKI JAKARTA' },
      { code: '32', name: 'JAWA BARAT' },
      { code: '33', name: 'JAWA TENGAH' },
      { code: '34', name: 'DI YOGYAKARTA' },
      { code: '35', name: 'JAWA TIMUR' },
      { code: '36', name: 'BANTEN' }
    ]
  }
}

/**
 * Get regencies by province code
 * @param provinceCode - Province code (e.g., '36' for Banten)
 * @returns Promise<Regency[]>
 */
export async function getRegenciesByProvince(provinceCode: string): Promise<Regency[]> {
  const allRegencies = await getIndonesianRegencies()
  return allRegencies.filter(r => r.provinceCode === provinceCode)
}
