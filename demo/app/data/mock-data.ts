import type { User, Semester, MataPelajaran, Kelas, PresensiSession, PresensiRecord, NilaiKomponen, Nilai, Spp, Gaji, Announcement, AcademicRemark, MateriSection } from "~/types/entities"
import type { AuthUser } from "~/types/auth"

interface MockRaporFile {
  id: string
  studentId: string
  semesterId: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  fileUrl: string | null
  createdAt: string
  updatedAt: string
}

const now = new Date().toISOString()
const day = 86400000

export const mockUsers: User[] = [
  { id: "u-admin-1", email: "admin@hcq.com", nama: "Admin HCQ", role: "ADMIN", fullName: "Admin Halaqoh Cinta Qur'an", phoneNumber: "081234567890", address: "Jl. Merdeka No. 1", cities: "Jakarta Pusat", createdAt: new Date(Date.now() - 90 * day).toISOString(), updatedAt: now },
  { id: "u-pengajar-1", email: "ustadz.ahmad@hcq.com", nama: "Ustadz Ahmad", role: "PENGAJAR", fullName: "Ahmad Fauzi, S.Pd.I", phoneNumber: "081234567891", address: "Jl. Sudirman No. 10", cities: "Jakarta Selatan", createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: now },
  { id: "u-pengajar-2", email: "ustadzah.fatimah@hcq.com", nama: "Ustadzah Fatimah", role: "PENGAJAR", fullName: "Fatimah Az-Zahra, Lc.", phoneNumber: "081234567892", address: "Jl. Thamrin No. 5", cities: "Jakarta Pusat", createdAt: new Date(Date.now() - 45 * day).toISOString(), updatedAt: now },
  { id: "u-pelajar-1", email: "ahmad.fauzan@hcq.com", nama: "Ahmad Fauzan", role: "PELAJAR", fullName: "Ahmad Fauzan", phoneNumber: "081234567893", address: "Jl. Kebon Jeruk No. 3", cities: "Jakarta Barat", createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "u-pelajar-2", email: "siti.nurhaliza@hcq.com", nama: "Siti Nurhaliza", role: "PELAJAR", fullName: "Siti Nurhaliza", phoneNumber: "081234567894", address: "Jl. Mangga Dua No. 7", cities: "Jakarta Utara", createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "u-pelajar-3", email: "muhammad.ali@hcq.com", nama: "Muhammad Ali", role: "PELAJAR", fullName: "Muhammad Ali", phoneNumber: "081234567895", address: "Jl. Ciputat Raya No. 12", cities: "Tangerang Selatan", createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
]

export const mockAuthUsers: AuthUser[] = mockUsers.map(u => ({
  id: u.id,
  fullName: u.fullName || u.nama,
  nama: u.nama,
  email: u.email,
  phoneNumber: u.phoneNumber,
  cities: u.cities,
  address: u.address,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
}))

export const mockSemesters: Semester[] = [
  { id: "sem-1", nama: "Semester Ganjil 2025/2026", tanggalMulai: "2025-07-14", tanggalAkhir: "2025-12-20", status: "AKTIF", createdAt: new Date(Date.now() - 120 * day).toISOString(), updatedAt: now },
  { id: "sem-2", nama: "Semester Genap 2024/2025", tanggalMulai: "2025-01-13", tanggalAkhir: "2025-06-21", status: "SELESAI", createdAt: new Date(Date.now() - 300 * day).toISOString(), updatedAt: new Date(Date.now() - 30 * day).toISOString() },
  { id: "sem-3", nama: "Semester Genap 2025/2026", tanggalMulai: "2026-01-12", tanggalAkhir: "2026-06-20", status: "MENDATANG", createdAt: now, updatedAt: now },
]

export const mockMataPelajaran: MataPelajaran[] = [
  { id: "mapel-1", nama: "Tahsin Al-Qur'an", kode: "TAH-001", deskripsi: "Pembelajaran tahsin tilawah Al-Qur'an dengan metode talaqqi", createdAt: new Date(Date.now() - 200 * day).toISOString(), updatedAt: now },
  { id: "mapel-2", nama: "Tahfidz Al-Qur'an", kode: "THF-001", deskripsi: "Program menghafal Al-Qur'an dengan target 1 juz per semester", createdAt: new Date(Date.now() - 200 * day).toISOString(), updatedAt: now },
  { id: "mapel-3", nama: "Fiqh Ibadah", kode: "FIQ-001", deskripsi: "Pembelajaran fiqh ibadah sehari-hari berdasarkan Al-Qur'an dan Sunnah", createdAt: new Date(Date.now() - 200 * day).toISOString(), updatedAt: now },
  { id: "mapel-4", nama: "Akidah Akhlak", kode: "AKI-001", deskripsi: "Pembelajaran akidah Islam dan pembentukan akhlak mulia", createdAt: new Date(Date.now() - 200 * day).toISOString(), updatedAt: now },
  { id: "mapel-5", nama: "Bahasa Arab", kode: "BA-001", deskripsi: "Pembelajaran bahasa Arab dasar untuk memahami Al-Qur'an", createdAt: new Date(Date.now() - 200 * day).toISOString(), updatedAt: now },
]

const enrollments: Enrollment[] = [
  { id: "enr-1", userId: "u-pelajar-1", kelasId: "kelas-1", role: "PELAJAR", user: mockUsers[3], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-2", userId: "u-pelajar-2", kelasId: "kelas-1", role: "PELAJAR", user: mockUsers[4], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-3", userId: "u-pelajar-3", kelasId: "kelas-1", role: "PELAJAR", user: mockUsers[5], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-4", userId: "u-pelajar-1", kelasId: "kelas-2", role: "PELAJAR", user: mockUsers[3], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-5", userId: "u-pelajar-2", kelasId: "kelas-2", role: "PELAJAR", user: mockUsers[4], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-6", userId: "u-pelajar-3", kelasId: "kelas-3", role: "PELAJAR", user: mockUsers[5], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-7", userId: "u-pengajar-1", kelasId: "kelas-1", role: "PENGAJAR", user: mockUsers[1], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-8", userId: "u-pengajar-2", kelasId: "kelas-2", role: "PENGAJAR", user: mockUsers[2], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
  { id: "enr-9", userId: "u-pengajar-1", kelasId: "kelas-3", role: "PENGAJAR", user: mockUsers[1], joinedAt: new Date(Date.now() - 60 * day).toISOString() },
]

export const mockKelas: Kelas[] = [
  {
    id: "kelas-1", namaKelas: "Tahsin Reguler", semesterId: "sem-1", mataPelajaranId: "mapel-1",
    jadwalHari: "Senin & Rabu", jadwalJam: "08:00 - 09:30",
    semester: mockSemesters[0], mataPelajaran: mockMataPelajaran[0],
    enrollments: enrollments.filter(e => e.kelasId === "kelas-1"),
    _count: { enrollments: enrollments.filter(e => e.kelasId === "kelas-1" && e.role === "PELAJAR").length },
    createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: now,
  },
  {
    id: "kelas-2", namaKelas: "Tahfidz Intensif", semesterId: "sem-1", mataPelajaranId: "mapel-2",
    jadwalHari: "Selasa & Kamis", jadwalJam: "07:30 - 09:00",
    semester: mockSemesters[0], mataPelajaran: mockMataPelajaran[1],
    enrollments: enrollments.filter(e => e.kelasId === "kelas-2"),
    _count: { enrollments: enrollments.filter(e => e.kelasId === "kelas-2" && e.role === "PELAJAR").length },
    createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: now,
  },
  {
    id: "kelas-3", namaKelas: "Fiqh Ahad", semesterId: "sem-1", mataPelajaranId: "mapel-3",
    jadwalHari: "Ahad", jadwalJam: "09:00 - 11:00",
    semester: mockSemesters[0], mataPelajaran: mockMataPelajaran[2],
    enrollments: enrollments.filter(e => e.kelasId === "kelas-3"),
    _count: { enrollments: enrollments.filter(e => e.kelasId === "kelas-3" && e.role === "PELAJAR").length },
    createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: now,
  },
]

export const mockPresensiSessions: PresensiSession[] = [
  { id: "ps-1", kelasId: "kelas-1", kode: "123456", tanggal: new Date(Date.now() - 7 * day).toISOString().split("T")[0], expiresAt: new Date(Date.now() - 7 * day + 3600000).toISOString(), isActive: false, kelas: mockKelas[0], createdAt: new Date(Date.now() - 7 * day).toISOString(), updatedAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: "ps-2", kelasId: "kelas-2", kode: "789012", tanggal: new Date(Date.now() - 5 * day).toISOString().split("T")[0], expiresAt: new Date(Date.now() - 5 * day + 3600000).toISOString(), isActive: false, kelas: mockKelas[1], createdAt: new Date(Date.now() - 5 * day).toISOString(), updatedAt: new Date(Date.now() - 5 * day).toISOString() },
  { id: "ps-3", kelasId: "kelas-1", kode: "345678", tanggal: new Date(Date.now() - 3 * day).toISOString().split("T")[0], expiresAt: new Date(Date.now() - 3 * day + 3600000).toISOString(), isActive: false, kelas: mockKelas[0], createdAt: new Date(Date.now() - 3 * day).toISOString(), updatedAt: new Date(Date.now() - 3 * day).toISOString() },
]

export const mockPresensiRecords: PresensiRecord[] = [
  { id: "pr-1", sessionId: "ps-1", userId: "u-pelajar-1", status: "HADIR", timestamp: new Date(Date.now() - 7 * day).toISOString(), isManual: false, user: mockUsers[3], createdAt: new Date(Date.now() - 7 * day).toISOString(), updatedAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: "pr-2", sessionId: "ps-1", userId: "u-pelajar-2", status: "HADIR", timestamp: new Date(Date.now() - 7 * day).toISOString(), isManual: false, user: mockUsers[4], createdAt: new Date(Date.now() - 7 * day).toISOString(), updatedAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: "pr-3", sessionId: "ps-1", userId: "u-pelajar-3", status: "IZIN", timestamp: new Date(Date.now() - 7 * day).toISOString(), isManual: true, user: mockUsers[5], createdAt: new Date(Date.now() - 7 * day).toISOString(), updatedAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: "pr-4", sessionId: "ps-2", userId: "u-pelajar-1", status: "HADIR", timestamp: new Date(Date.now() - 5 * day).toISOString(), isManual: false, user: mockUsers[3], createdAt: new Date(Date.now() - 5 * day).toISOString(), updatedAt: new Date(Date.now() - 5 * day).toISOString() },
  { id: "pr-5", sessionId: "ps-2", userId: "u-pelajar-2", status: "SAKIT", timestamp: new Date(Date.now() - 5 * day).toISOString(), isManual: true, user: mockUsers[4], createdAt: new Date(Date.now() - 5 * day).toISOString(), updatedAt: new Date(Date.now() - 5 * day).toISOString() },
  { id: "pr-6", sessionId: "ps-3", userId: "u-pelajar-1", status: "HADIR", timestamp: new Date(Date.now() - 3 * day).toISOString(), isManual: false, user: mockUsers[3], createdAt: new Date(Date.now() - 3 * day).toISOString(), updatedAt: new Date(Date.now() - 3 * day).toISOString() },
  { id: "pr-7", sessionId: "ps-3", userId: "u-pelajar-2", status: "HADIR", timestamp: new Date(Date.now() - 3 * day).toISOString(), isManual: false, user: mockUsers[4], createdAt: new Date(Date.now() - 3 * day).toISOString(), updatedAt: new Date(Date.now() - 3 * day).toISOString() },
  { id: "pr-8", sessionId: "ps-3", userId: "u-pelajar-3", status: "ALFA", timestamp: new Date(Date.now() - 3 * day).toISOString(), isManual: false, user: mockUsers[5], createdAt: new Date(Date.now() - 3 * day).toISOString(), updatedAt: new Date(Date.now() - 3 * day).toISOString() },
]

const pelajarIds = ["u-pelajar-1", "u-pelajar-2", "u-pelajar-3"]
const komponenTahsin = [
  { id: "komp-1", kelasId: "kelas-1", nama: "Tugas Harian", bobot: 20, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-2", kelasId: "kelas-1", nama: "Ujian Tengah Semester", bobot: 30, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-3", kelasId: "kelas-1", nama: "Ujian Akhir Semester", bobot: 50, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
]
const komponenTahfidz = [
  { id: "komp-4", kelasId: "kelas-2", nama: "Setoran Hafalan", bobot: 40, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-5", kelasId: "kelas-2", nama: "Muroja'ah", bobot: 25, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-6", kelasId: "kelas-2", nama: "Ujian Akhir", bobot: 35, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
]
const komponenFiqh = [
  { id: "komp-7", kelasId: "kelas-3", nama: "Tugas Harian", bobot: 15, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-8", kelasId: "kelas-3", nama: "Praktik Ibadah", bobot: 35, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "komp-9", kelasId: "kelas-3", nama: "Ujian Akhir", bobot: 50, createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
]
export const mockNilaiKomponen: NilaiKomponen[] = [...komponenTahsin, ...komponenTahfidz, ...komponenFiqh]

function randomNilai(min = 60, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const mockNilaiEntries: Nilai[] = [
  { id: "nil-1", komponenId: "komp-1", userId: "u-pelajar-1", nilai: randomNilai(70, 95), komponen: komponenTahsin[0], user: mockUsers[3], createdAt: now, updatedAt: now },
  { id: "nil-2", komponenId: "komp-1", userId: "u-pelajar-2", nilai: randomNilai(70, 95), komponen: komponenTahsin[0], user: mockUsers[4], createdAt: now, updatedAt: now },
  { id: "nil-3", komponenId: "komp-1", userId: "u-pelajar-3", nilai: randomNilai(70, 95), komponen: komponenTahsin[0], user: mockUsers[5], createdAt: now, updatedAt: now },
  { id: "nil-4", komponenId: "komp-2", userId: "u-pelajar-1", nilai: randomNilai(65, 90), komponen: komponenTahsin[1], user: mockUsers[3], createdAt: now, updatedAt: now },
  { id: "nil-5", komponenId: "komp-2", userId: "u-pelajar-2", nilai: randomNilai(65, 90), komponen: komponenTahsin[1], user: mockUsers[4], createdAt: now, updatedAt: now },
  { id: "nil-6", komponenId: "komp-2", userId: "u-pelajar-3", nilai: randomNilai(65, 90), komponen: komponenTahsin[1], user: mockUsers[5], createdAt: now, updatedAt: now },
  { id: "nil-7", komponenId: "komp-4", userId: "u-pelajar-1", nilai: randomNilai(75, 98), komponen: komponenTahfidz[0], user: mockUsers[3], createdAt: now, updatedAt: now },
  { id: "nil-8", komponenId: "komp-4", userId: "u-pelajar-2", nilai: randomNilai(75, 98), komponen: komponenTahfidz[0], user: mockUsers[4], createdAt: now, updatedAt: now },
  { id: "nil-9", komponenId: "komp-5", userId: "u-pelajar-1", nilai: randomNilai(70, 95), komponen: komponenTahfidz[1], user: mockUsers[3], createdAt: now, updatedAt: now },
  { id: "nil-10", komponenId: "komp-5", userId: "u-pelajar-2", nilai: randomNilai(70, 95), komponen: komponenTahfidz[1], user: mockUsers[4], createdAt: now, updatedAt: now },
]

export const mockSpp: Spp[] = [
  { id: "spp-1", userId: "u-pelajar-1", bulan: "Januari", tahun: 2026, nominal: 150000, status: "LUNAS", user: mockUsers[3], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "spp-2", userId: "u-pelajar-1", bulan: "Februari", tahun: 2026, nominal: 150000, status: "LUNAS", user: mockUsers[3], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
  { id: "spp-3", userId: "u-pelajar-1", bulan: "Maret", tahun: 2026, nominal: 150000, status: "BELUM_LUNAS", user: mockUsers[3], createdAt: now, updatedAt: now },
  { id: "spp-4", userId: "u-pelajar-2", bulan: "Januari", tahun: 2026, nominal: 150000, status: "LUNAS", user: mockUsers[4], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "spp-5", userId: "u-pelajar-2", bulan: "Februari", tahun: 2026, nominal: 150000, status: "BELUM_LUNAS", user: mockUsers[4], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
  { id: "spp-6", userId: "u-pelajar-3", bulan: "Januari", tahun: 2026, nominal: 150000, status: "LUNAS", user: mockUsers[5], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "spp-7", userId: "u-pelajar-3", bulan: "Februari", tahun: 2026, nominal: 150000, status: "LUNAS", user: mockUsers[5], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
  { id: "spp-8", userId: "u-pelajar-3", bulan: "Maret", tahun: 2026, nominal: 150000, status: "BELUM_LUNAS", user: mockUsers[5], createdAt: now, updatedAt: now },
]

export const mockGaji: Gaji[] = [
  { id: "gj-1", userId: "u-pengajar-1", bulan: "Januari", tahun: 2026, nominal: 1500000, status: "LUNAS", user: mockUsers[1], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "gj-2", userId: "u-pengajar-1", bulan: "Februari", tahun: 2026, nominal: 1500000, status: "BELUM_LUNAS", user: mockUsers[1], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
  { id: "gj-3", userId: "u-pengajar-2", bulan: "Januari", tahun: 2026, nominal: 1200000, status: "LUNAS", user: mockUsers[2], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: now },
  { id: "gj-4", userId: "u-pengajar-2", bulan: "Februari", tahun: 2026, nominal: 1200000, status: "BELUM_LUNAS", user: mockUsers[2], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
]

export const mockAnnouncements: Announcement[] = [
  { id: "ann-1", judul: "Pembukaan Pendaftaran Semester Ganjil 2025/2026", isi: "Assalamu'alaikum warahmatullahi wabarakatuh. Diberitahukan kepada seluruh calon peserta didik bahwa pendaftaran semester ganjil telah dibuka. Silakan menghubungi admin untuk informasi lebih lanjut.", scope: "GLOBAL", creatorId: "u-admin-1", creator: mockUsers[0], createdAt: new Date(Date.now() - 14 * day).toISOString(), updatedAt: new Date(Date.now() - 14 * day).toISOString() },
  { id: "ann-2", judul: "Jadwal UTS Tahsin Reguler", isi: "Ujian Tengah Semester untuk kelas Tahsin Reguler akan dilaksanakan pada hari Senin, 10 Maret 2026. Mohon persiapkan diri dengan baik.", scope: "KELAS", kelasId: "kelas-1", creatorId: "u-pengajar-1", creator: mockUsers[1], kelas: mockKelas[0], createdAt: new Date(Date.now() - 7 * day).toISOString(), updatedAt: new Date(Date.now() - 7 * day).toISOString() },
  { id: "ann-3", judul: "Libur Hari Raya", isi: "Libur Hari Raya Idul Fitri 1447 H akan dimulai pada tanggal 20 Maret 2026. Kegiatan belajar mengajar akan kembali aktif pada tanggal 5 April 2026.", scope: "GLOBAL", creatorId: "u-admin-1", creator: mockUsers[0], createdAt: new Date(Date.now() - 3 * day).toISOString(), updatedAt: new Date(Date.now() - 3 * day).toISOString() },
]

export const mockAcademicRemarks: AcademicRemark[] = [
  { id: "ar-1", userId: "u-pelajar-1", kelasId: "kelas-1", semesterId: "sem-1", catatan: "Ahmad menunjukkan peningkatan signifikan dalam tajwid. Perlu lebih banyak latihan makharijul huruf.", user: mockUsers[3], kelas: { ...mockKelas[0], mataPelajaran: mockMataPelajaran[0] }, semester: mockSemesters[0], createdAt: new Date(Date.now() - 20 * day).toISOString(), updatedAt: now },
  { id: "ar-2", userId: "u-pelajar-2", kelasId: "kelas-1", semesterId: "sem-1", catatan: "Siti sangat rajin dan memiliki hafalan yang baik. Disarankan untuk mengikuti program tahfidz.", user: mockUsers[4], kelas: { ...mockKelas[0], mataPelajaran: mockMataPelajaran[0] }, semester: mockSemesters[0], createdAt: new Date(Date.now() - 15 * day).toISOString(), updatedAt: now },
  { id: "ar-3", userId: "u-pelajar-3", kelasId: "kelas-3", semesterId: "sem-1", catatan: "Muhammad perlu meningkatkan kedisiplinan dalam menghadiri kelas.", user: mockUsers[5], kelas: { ...mockKelas[2], mataPelajaran: mockMataPelajaran[2] }, semester: mockSemesters[0], createdAt: new Date(Date.now() - 10 * day).toISOString(), updatedAt: now },
]

export const mockMateriSections: MateriSection[] = [
  { id: "ms-1", kelasId: "kelas-1", judul: "Pertemuan 1: Pengertian Tahsin", deskripsi: "Materi pengantar tentang pentingnya tahsin dalam membaca Al-Qur'an", files: [], createdAt: new Date(Date.now() - 30 * day).toISOString(), updatedAt: new Date(Date.now() - 30 * day).toISOString() },
  { id: "ms-2", kelasId: "kelas-1", judul: "Pertemuan 2: Makharijul Huruf", deskripsi: "Pembelajaran tentang tempat keluar huruf hijaiyah", files: [], createdAt: new Date(Date.now() - 20 * day).toISOString(), updatedAt: new Date(Date.now() - 20 * day).toISOString() },
  { id: "ms-3", kelasId: "kelas-2", judul: "Setoran Juz 1", deskripsi: "Target hafalan juz 1 (Al-Fatihah + Al-Baqarah 1-141)", files: [], createdAt: new Date(Date.now() - 25 * day).toISOString(), updatedAt: new Date(Date.now() - 25 * day).toISOString() },
]

export const mockRaporFiles: MockRaporFile[] = [
  { id: "rf-1", studentId: "u-pelajar-1", semesterId: "sem-2", status: "COMPLETED", fileUrl: "#", createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: new Date(Date.now() - 58 * day).toISOString() },
  { id: "rf-2", studentId: "u-pelajar-2", semesterId: "sem-2", status: "COMPLETED", fileUrl: "#", createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: new Date(Date.now() - 58 * day).toISOString() },
  { id: "rf-3", studentId: "u-pelajar-3", semesterId: "sem-2", status: "COMPLETED", fileUrl: "#", createdAt: new Date(Date.now() - 60 * day).toISOString(), updatedAt: new Date(Date.now() - 58 * day).toISOString() },
]

interface TokenPayload {
  userId: string
  email: string
  role: string
  exp: number
}

function createFakeToken(userId: string, email: string, role: string): string {
  const payload: TokenPayload = { userId, email, role, exp: Date.now() + 86400000 }
  return "mock-jwt." + btoa(JSON.stringify(payload)) + ".signature"
}

function decodeFakeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

export function mockLogin(email: string, _password: string): { accessToken: string; user: AuthUser } | null {
  const user = mockAuthUsers.find(u => u.email === email)
  if (!user) return null
  return { accessToken: createFakeToken(user.id, user.email, user.role || "PELAJAR"), user }
}

export function mockValidateToken(token: string): AuthUser | null {
  const payload = decodeFakeToken(token)
  if (!payload || payload.exp < Date.now()) return null
  return mockAuthUsers.find(u => u.id === payload.userId) || null
}

export function mockGetUserById(userId: string): User | undefined {
  return mockUsers.find(u => u.id === userId)
}

export function randomId(prefix = "mock"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
