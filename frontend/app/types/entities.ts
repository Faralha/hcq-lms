export type UserRole = "ADMIN" | "PENGAJAR" | "PELAJAR";

export interface User {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  cities?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalAkhir: string;
  status: "AKTIF" | "MENDATANG" | "SELESAI";
  createdAt: string;
  updatedAt: string;
}

export interface MataPelajaran {
  id: string;
  nama: string;
  kode: string;
  deskripsi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  kelasId: string;
  role: UserRole;
  user: User;
  joinedAt: string;
}

export interface Kelas {
  id: string;
  namaKelas: string;
  semesterId: string;
  mataPelajaranId: string;
  jadwalHari: string;
  jadwalJam: string;
  semester?: Semester;
  mataPelajaran?: MataPelajaran;
  enrollments?: Enrollment[];
  _count?: {
    enrollments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type PresensiStatus = "HADIR" | "SAKIT" | "IZIN" | "ALFA";

export interface PresensiRecord {
  id: string;
  sessionId: string;
  userId: string;
  status: PresensiStatus;
  timestamp: string;
  isManual: boolean;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface PresensiSession {
  id: string;
  kelasId: string;
  kode: string;
  tanggal: string;
  expiresAt: string;
  isActive: boolean;
  kelas?: Kelas;
  records?: PresensiRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface MateriFile {
  id: string;
  sectionId: string;
  judul: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface MateriSection {
  id: string;
  kelasId: string;
  judul: string;
  deskripsi?: string;
  files?: MateriFile[];
  createdAt: string;
  updatedAt: string;
}

export interface NilaiKomponen {
  id: string;
  kelasId: string;
  nama: string;
  bobot: number;
  createdAt: string;
  updatedAt: string;
}

export interface Nilai {
  id: string;
  komponenId: string;
  userId: string;
  nilai: number;
  komponen?: NilaiKomponen;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export type AnnouncementScope = "GLOBAL" | "KELAS";

export interface Announcement {
  id: string;
  judul: string;
  isi: string;
  scope: AnnouncementScope;
  kelasId?: string;
  creatorId: string;
  kelas?: Kelas;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "LUNAS" | "BELUM_LUNAS";

export interface Gaji {
  id: string;
  userId: string;
  bulan: string;
  tahun: number;
  nominal: number;
  status: PaymentStatus;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Spp {
  id: string;
  userId: string;
  bulan: string;
  tahun: number;
  nominal: number;
  status: PaymentStatus;
  user?: User;
  createdAt: string;
  updatedAt: string;
}
