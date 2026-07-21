export interface Regency {
  code: string;
  name: string;
  provinceCode: string;
}

export interface Province {
  code: string;
  name: string;
}



// Fetch static Indonesian area data from public/indonesian-area.json
interface IndonesianAreaData {
  provinces: Province[];
  cities: Regency[];
}

let cachedAreaData: IndonesianAreaData | null = null;

async function fetchAreaData(): Promise<IndonesianAreaData> {
  if (cachedAreaData) return cachedAreaData;
  const res = await fetch('/indonesian-area.json');
  if (!res.ok) throw new Error('Failed to fetch Indonesian area data');
  cachedAreaData = await res.json();
  // @ts-ignore
  return cachedAreaData;
  // @ts-check
}

export async function getIndonesianRegencies(): Promise<Regency[]> {
  const data = await fetchAreaData();
  return data.cities.map((r: any) => ({
    code: r.code,
    name: r.name,
    provinceCode: r.province_code
  }));
}

export async function getIndonesianProvinces(): Promise<Province[]> {
  const data = await fetchAreaData();
  return data.provinces;
}


// Utility: Get regencies by province code
export async function getRegenciesByProvince(provinceCode: string): Promise<Regency[]> {
  const allRegencies = await getIndonesianRegencies();
  return allRegencies.filter(r => r.provinceCode === provinceCode);
}
