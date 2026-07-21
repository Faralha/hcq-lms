import type { ApiRequestConfig } from "~/types/api"
import {
  mockUsers, mockAuthUsers, mockSemesters, mockMataPelajaran,
  mockKelas, mockPresensiSessions, mockPresensiRecords,
  mockNilaiKomponen, mockNilaiEntries, mockSpp,
  mockGaji, mockAnnouncements, mockAcademicRemarks,
  mockMateriSections, mockRaporFiles,
  mockLogin, mockValidateToken,
  randomId
} from "~/data/mock-data"

function delay(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function ok<T>(data: T, status = 1, message = "OK"): { status: number; data: T; message: string } {
  return { status, data, message }
}

function paginated<T>(data: T[], page = 1, limit = 10): { status: number; data: T[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } } {
  const total = data.length
  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit
  const paged = data.slice(start, start + limit)
  return {
    status: 1,
    data: paged,
    meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  }
}

function extractToken(headers: Record<string, string>): string | null {
  const auth = headers["Authorization"] || ""
  return auth.startsWith("Bearer ") ? auth.slice(7) : null
}

function requireAuth(headers: Record<string, string>): { userId: string; role: string } | null {
  const token = extractToken(headers)
  if (!token) return null
  const user = mockValidateToken(token)
  if (!user) return null
  return { userId: user.id, role: user.role || "PELAJAR" }
}

export const useMockApi = () => {
  const request = async <T = any>(endpoint: string, options: ApiRequestConfig = {}): Promise<T> => {
    const { method = "GET", body, query, headers = {} } = options
    const cleanEndpoint = endpoint.replace(/^\//, "")
    const auth = requireAuth(headers)

    await delay(200 + Math.random() * 300)

    const helper = {
      auth,
      userId: auth?.userId || "",
      role: auth?.role || "",
      param: (idx: number): string => parts[idx] || "",
      params: (startIdx: number): string[] => parts.slice(startIdx),
    }

    const parts = cleanEndpoint.split("/")

    switch (method) {

      // ─────────── AUTH ───────────
      case "POST": {
        switch (parts[0]) {
          case "auth": {
            switch (parts[1]) {
              case "login": {
                const { email, password } = body || {}
                const result = mockLogin(email, password)
                if (!result) return { status: 0, message: "Email atau password salah", data: null } as T
                return ok(result) as T
              }
              case "register": {
                return ok({ user: mockAuthUsers[mockAuthUsers.length - 1], message: "Pendaftaran berhasil" }) as T
              }
              case "logout": {
                return ok({ message: "Berhasil logout" }) as T
              }
              case "refresh": {
                const u = mockAuthUsers[0]
                const r = mockLogin(u.email, "")
                return ok(r || { accessToken: "", user: u }) as T
              }
              case "forgot-password": {
                return ok({ message: "Email reset password telah dikirim" }) as T
              }
              case "reset-password": {
                return ok({ message: "Password berhasil direset" }) as T
              }
              case "verify-email": {
                return ok({ message: "Email berhasil diverifikasi" }) as T
              }
              case "resend-verification": {
                return ok({ message: "Email verifikasi telah dikirim ulang" }) as T
              }
              case "invite-pengajar": {
                const { email } = body || {}
                return ok({
                  message: "Undangan berhasil dikirim",
                  email,
                  magicLink: `https://demo.hcq.app/auth/register-pengajar?token=mock-invite-${Date.now()}`,
                  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
                }) as T
              }
              case "change-password": {
                return ok({ message: "Password berhasil diubah" }) as T
              }
              case "invitations": {
                if (parts[2] === "resend") {
                  return ok({ magicLink: `https://demo.hcq.app/auth/register-pengajar?token=mock-${randomId()}` }) as T
                }
                break
              }
            }
            break
          }
          case "presensi": {
            switch (parts[1]) {
              case "kelas": {
                const { param: kelasId } = helper
                const kelas = mockKelas.find(k => k.id === parts[2])
                const kode = Math.floor(100000 + Math.random() * 900000).toString()
                const session = {
                  id: `ps-mock-${Date.now()}`,
                  kelasId: parts[2],
                  kode,
                  tanggal: new Date().toISOString().split("T")[0],
                  expiresAt: new Date(Date.now() + 3600000).toISOString(),
                  isActive: true,
                  kelas,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
                mockPresensiSessions.push(session)
                return ok({ message: "Kelas dimulai", kode, expiresAt: session.expiresAt, session }) as T
              }
              case "session": {
                if (parts[3] === "stop") {
                  const session = mockPresensiSessions.find(s => s.id === parts[2])
                  if (session) session.isActive = false
                  return ok({ ...session, records: mockPresensiRecords.filter(r => r.sessionId === parts[2]) }) as T
                }
                if (parts[3] === "manual") {
                  const record = {
                    id: `pr-mock-${Date.now()}`,
                    sessionId: parts[2],
                    userId: body?.pelajarId || "u-pelajar-1",
                    status: body?.status || "HADIR",
                    timestamp: new Date().toISOString(),
                    isManual: true,
                    user: mockUsers.find(u => u.id === (body?.pelajarId || "u-pelajar-1")),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                  mockPresensiRecords.push(record)
                  return ok(record) as T
                }
                break
              }
              case "hadir": {
                const { kodePresensi } = body || {}
                const session = mockPresensiSessions.find(s => s.kode === kodePresensi)
                if (!session || !helper.userId) return { status: 0, message: "Kode tidak valid", data: null } as T
                const record = {
                  id: `pr-mock-${Date.now()}`,
                  sessionId: session.id,
                  userId: helper.userId,
                  status: "HADIR" as const,
                  timestamp: new Date().toISOString(),
                  isManual: false,
                  user: mockUsers.find(u => u.id === helper.userId),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
                mockPresensiRecords.push(record)
                return ok({ message: "Presensi berhasil", record }) as T
              }
            }
            break
          }
          case "nilai": {
            if (parts[1] === "komponen") {
              const komponen = {
                id: `komp-mock-${Date.now()}`,
                kelasId: body?.kelasId || "",
                nama: body?.nama || "Komponen Baru",
                bobot: body?.bobot || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              mockNilaiKomponen.push(komponen)
              return ok(komponen) as T
            }
            if (parts[1] === "entry") {
              const { komponenId, pelajarId, nilai } = body || {}
              const entry = {
                id: `nil-mock-${Date.now()}`,
                komponenId,
                userId: pelajarId,
                nilai,
                komponen: mockNilaiKomponen.find(k => k.id === komponenId),
                user: mockUsers.find(u => u.id === pelajarId),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              mockNilaiEntries.push(entry)
              return ok({ message: "Nilai berhasil disimpan", nilai: entry }) as T
            }
            break
          }
          case "spp": {
            const { userId, nominal, bulan, tahun, status } = body || {}
            const spp = {
              id: `spp-mock-${Date.now()}`,
              userId: userId || helper.userId,
              bulan: bulan || "Januari",
              tahun: tahun || new Date().getFullYear(),
              nominal: nominal || 0,
              status: status || "BELUM_LUNAS" as const,
              user: mockUsers.find(u => u.id === (userId || helper.userId)),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockSpp.push(spp)
            return ok(spp) as T
          }
          case "gaji": {
            const gaji = {
              id: `gj-mock-${Date.now()}`,
              userId: body?.userId || "",
              bulan: body?.bulan || "Januari",
              tahun: body?.tahun || new Date().getFullYear(),
              nominal: body?.nominal || 0,
              status: body?.status || "BELUM_LUNAS" as const,
              user: mockUsers.find(u => u.id === (body?.userId || "")),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockGaji.push(gaji)
            return ok(gaji) as T
          }
          case "rapor": {
            if (parts[1] === "generate") {
              return ok({ raporFileId: `rf-mock-${Date.now()}`, status: "PENDING", message: "Rapor sedang diproses" }) as T
            }
            if (parts[1] === "retry") {
              return ok({ raporFileId: parts[2], status: "PENDING", message: "Rapor sedang diproses ulang" }) as T
            }
            break
          }
          case "announcement": {
            const ann = {
              id: `ann-mock-${Date.now()}`,
              judul: body?.judul || "Judul",
              isi: body?.isi || "Isi",
              scope: body?.scope || "GLOBAL" as const,
              kelasId: body?.kelasId || null,
              creatorId: helper.userId || "u-admin-1",
              creator: mockUsers.find(u => u.id === helper.userId),
              kelas: body?.kelasId ? mockKelas.find(k => k.id === body.kelasId) : undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockAnnouncements.unshift(ann)
            return ok(ann) as T
          }
          case "academic-remark": {
            const remark = {
              id: `ar-mock-${Date.now()}`,
              userId: body?.userId || "",
              kelasId: body?.kelasId || "",
              semesterId: body?.semesterId || "",
              catatan: body?.catatan || "",
              user: mockUsers.find(u => u.id === (body?.userId || "")),
              kelas: mockKelas.find(k => k.id === (body?.kelasId || "")) as any,
              semester: mockSemesters.find(s => s.id === (body?.semesterId || "")),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockAcademicRemarks.push(remark)
            return ok(remark) as T
          }
          case "materi": {
            if (parts[1] === "section") {
              const section = {
                id: `ms-mock-${Date.now()}`,
                kelasId: body?.kelasId || "",
                judul: body?.judul || "Materi Baru",
                deskripsi: body?.deskripsi || "",
                files: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              mockMateriSections.push(section)
              return ok(section) as T
            }
            if (parts[1] === "file" && !parts[3]) {
              return ok({
                id: `mf-mock-${Date.now()}`,
                sectionId: body?.materiSectionId || "",
                judul: "Dummy File",
                filename: "dummy.pdf",
                mimetype: "application/pdf",
                size: 1024,
                url: "#",
                createdAt: new Date().toISOString(),
              }) as T
            }
            break
          }
          case "kelas": {
            if (parts.length >= 3) {
              if (parts[2] === "enroll-pelajar") {
                return ok({ message: "Pelajar berhasil didaftarkan" }) as T
              }
              if (parts[2] === "assign-pengajar") {
                return ok({ message: "Pengajar berhasil ditugaskan" }) as T
              }
            }
            break
          }
          case "users": {
            return ok({
              id: `u-mock-${Date.now()}`,
              email: body?.email || "new@hcq.com",
              nama: body?.nama || "User Baru",
              role: body?.role || "PELAJAR",
              fullName: body?.fullName || "User Baru",
              phoneNumber: body?.phoneNumber || "",
              address: body?.address || "",
              cities: body?.cities || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }) as T
          }
          case "semesters": {
            const sem = {
              id: `sem-mock-${Date.now()}`,
              nama: body?.nama || "Semester Baru",
              tanggalMulai: body?.tanggalMulai || new Date().toISOString().split("T")[0],
              tanggalAkhir: body?.tanggalAkhir || new Date().toISOString().split("T")[0],
              status: body?.status || "MENDATANG" as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockSemesters.push(sem)
            return ok(sem) as T
          }
          case "mata-pelajaran": {
            const mapel = {
              id: `mapel-mock-${Date.now()}`,
              nama: body?.nama || "Mata Pelajaran Baru",
              kode: body?.kode || "MPL-001",
              deskripsi: body?.deskripsi || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            mockMataPelajaran.push(mapel)
            return ok(mapel) as T
          }
        }
        break
      }

      // ─────────── GET ───────────
      case "GET": {
        switch (parts[0]) {
          case "auth": {
            switch (parts[1]) {
              case "me": {
                if (!helper.userId) return { status: 0, message: "Unauthorized", data: null } as T
                const user = mockAuthUsers.find(u => u.id === helper.userId)
                if (!user) return { status: 0, message: "User not found", data: null } as T
                return ok(user) as T
              }
              case "reset-password": {
                return ok({ valid: true }) as T
              }
              case "validate-invitation": {
                const email = query?.email || "pengajar@hcq.com"
                return ok({ valid: true, email, message: "Token valid" }) as T
              }
              case "invitations": {
                if (parts[2] && parts.length === 3) {
                  return ok({
                    id: parts[2],
                    email: "pengajar@hcq.com",
                    token: "mock-token",
                    used: false,
                    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
                    createdAt: new Date().toISOString(),
                    status: "PENDING",
                  }) as T
                }
                if (!parts[2]) {
                  return ok([
                    { id: "inv-1", email: "pengajar.baru1@hcq.com", token: "tok-1", used: false, expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(), createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: "PENDING" },
                    { id: "inv-2", email: "pengajar.baru2@hcq.com", token: "tok-2", used: true, expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(), createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), status: "USED" },
                  ]) as T
                }
                break
              }
            }
            break
          }
          case "users": {
            if (parts[1] === "me") {
              const u = mockUsers.find(u => u.id === helper.userId)
              return ok(u || mockUsers[0]) as T
            }
            return ok(mockUsers) as T
          }
          case "semesters": {
            return ok(mockSemesters) as T
          }
          case "mata-pelajaran": {
            return ok(mockMataPelajaran) as T
          }
          case "kelas": {
            if (parts[1]) {
              const kelas = mockKelas.find(k => k.id === parts[1])
              if (kelas) return ok({
                ...kelas,
                enrollments: (kelas.enrollments || []).map(e => ({
                  ...e,
                  user: mockUsers.find(u => u.id === e.userId),
                })),
              }) as T
              return { status: 0, message: "Kelas tidak ditemukan", data: null } as T
            }
            return ok(mockKelas) as T
          }
          case "presensi": {
            switch (parts[1]) {
              case "session": {
                const session = mockPresensiSessions.find(s => s.id === parts[2])
                if (session) return ok({
                  ...session,
                  records: mockPresensiRecords.filter(r => r.sessionId === parts[2]).map(r => ({
                    ...r,
                    user: mockUsers.find(u => u.id === r.userId),
                  })),
                }) as T
                return { status: 0, message: "Session tidak ditemukan", data: null } as T
              }
              case "riwayat": {
                if (parts[2]) {
                  return ok(mockPresensiRecords.filter(r => {
                    const s = mockPresensiSessions.find(s => s.id === r.sessionId)
                    return s?.kelasId === parts[2]
                  }).map(r => ({ ...r, user: mockUsers.find(u => u.id === r.userId) }))) as T
                }
                return ok(mockPresensiRecords.filter(r => r.userId === helper.userId).map(r => ({
                  ...r,
                  user: mockUsers.find(u => u.id === r.userId),
                  session: mockPresensiSessions.find(s => s.id === r.sessionId),
                }))) as T
              }
              case "kelas": {
                if (parts[2]) {
                  const sessions = mockPresensiSessions.filter(s => s.kelasId === parts[2])
                  return ok({
                    sessions: sessions.map(s => ({
                      id: s.id,
                      kode: s.kode,
                      tanggal: s.tanggal,
                      isActive: s.isActive,
                      records: mockPresensiRecords.filter(r => r.sessionId === s.id).map(r => ({
                        ...r,
                        user: mockUsers.find(u => u.id === r.userId),
                      })),
                    })),
                  }) as T
                }
                break
              }
            }
            break
          }
          case "nilai": {
            if (parts[1] === "saya") {
              const userId = helper.userId
              const pelajarKelas = mockKelas.filter(k =>
                k.enrollments?.some(e => e.userId === userId && e.role === "PELAJAR")
              )
              const nilaiSaya = pelajarKelas.map(k => {
                const komponenList = mockNilaiKomponen.filter(nk => nk.kelasId === k.id)
                const nilaiList = mockNilaiEntries.filter(n => n.userId === userId && komponenList.some(komp => komp.id === n.komponenId))
                return { kelas: k, nilaiList }
              })
              return ok(nilaiSaya) as T
            }
            if (parts[1] === "kelas" && parts[2]) {
              const kelas = mockKelas.find(k => k.id === parts[2])
              const komponenList = mockNilaiKomponen.filter(k => k.kelasId === parts[2])
              const pelajarEnrollments = (kelas?.enrollments || []).filter(e => e.role === "PELAJAR")
              const pelajarList = pelajarEnrollments.map(e => ({
                user: mockUsers.find(u => u.id === e.userId),
                nilaiList: komponenList.map(komp => {
                  const entry = mockNilaiEntries.find(n => n.komponenId === komp.id && n.userId === e.userId)
                  return { komponenId: komp.id, nilai: entry?.nilai || 0 }
                }),
              }))
              return ok({ kelas, komponenList, pelajarList }) as T
            }
            if (parts[1] === "komponen" && parts[2] === "kelas" && parts[3]) {
              return ok(mockNilaiKomponen.filter(k => k.kelasId === parts[3])) as T
            }
            break
          }
          case "spp": {
            if (parts[1] === "saya") {
              return ok(mockSpp.filter(s => s.userId === helper.userId).map(s => ({
                ...s, user: mockUsers.find(u => u.id === s.userId),
              }))) as T
            }
            if (parts[1] === "pelajar" && parts[2]) {
              return ok(mockSpp.filter(s => s.userId === parts[2]).map(s => ({
                ...s, user: mockUsers.find(u => u.id === s.userId),
              }))) as T
            }
            return ok(mockSpp.map(s => ({ ...s, user: mockUsers.find(u => u.id === s.userId) }))) as T
          }
          case "gaji": {
            if (parts[1] === "saya") {
              return ok(mockGaji.filter(g => g.userId === helper.userId).map(g => ({
                ...g, user: mockUsers.find(u => u.id === g.userId),
              }))) as T
            }
            if (parts[1] === "pengajar" && parts[2]) {
              return ok(mockGaji.filter(g => g.userId === parts[2]).map(g => ({
                ...g, user: mockUsers.find(u => u.id === g.userId),
              }))) as T
            }
            return ok(mockGaji.map(g => ({ ...g, user: mockUsers.find(u => u.id === g.userId) }))) as T
          }
          case "rapor": {
            if (parts[1] === "my-files") {
              const userFiles = mockRaporFiles.filter(r => r.studentId === helper.userId)
              return ok(userFiles.map(rf => ({
                ...rf,
                user: mockUsers.find(u => u.id === rf.studentId),
                semester: mockSemesters.find(s => s.id === rf.semesterId),
              }))) as T
            }
            if (parts[1] === "all") {
              return ok(mockRaporFiles.map(rf => ({
                ...rf,
                user: mockUsers.find(u => u.id === rf.studentId),
                semester: mockSemesters.find(s => s.id === rf.semesterId),
              }))) as T
            }
            if (parts[1] === "student" && parts[2]) {
              return ok(mockRaporFiles.filter(r => r.studentId === parts[2]).map(rf => ({
                ...rf,
                user: mockUsers.find(u => u.id === rf.studentId),
                semester: mockSemesters.find(s => s.id === rf.semesterId),
              }))) as T
            }
            if (parts[1] === "status" && parts[2]) {
              const rf = mockRaporFiles.find(r => r.id === parts[2])
              return ok(rf || { id: parts[2], status: "COMPLETED", fileUrl: "#" }) as T
            }
            if (parts[1] === "download" && parts[2]) {
              return "data:application/pdf;base64,JVBERi0xLjQK" as T
            }
            break
          }
          case "announcement": {
            const page = Number(query?.page) || 1
            const limit = Number(query?.limit) || 10
            const search = (query?.search as string) || ""
            let filtered = mockAnnouncements
            if (search) {
              const q = search.toLowerCase()
              filtered = mockAnnouncements.filter(a =>
                a.judul.toLowerCase().includes(q) || a.isi.toLowerCase().includes(q)
              )
            }
            return ok(paginated(filtered.map(a => ({
              ...a,
              creator: mockUsers.find(u => u.id === a.creatorId),
              kelas: a.kelasId ? mockKelas.find(k => k.id === a.kelasId) : undefined,
            })), page, limit)) as T
          }
          case "academic-remark": {
            if (parts[1] === "saya") {
              return ok(mockAcademicRemarks.filter(r => r.userId === helper.userId).map(r => ({
                ...r,
                user: mockUsers.find(u => u.id === r.userId),
                kelas: mockKelas.find(k => k.id === r.kelasId) as any,
                semester: mockSemesters.find(s => s.id === r.semesterId),
              }))) as T
            }
            if (parts[1] === "kelas" && parts[2]) {
              return ok(mockAcademicRemarks.filter(r => r.kelasId === parts[2]).map(r => ({
                ...r,
                user: mockUsers.find(u => u.id === r.userId),
                kelas: { ...mockKelas.find(k => k.id === r.kelasId), mataPelajaran: mockMataPelajaran.find(mp => mp.id === mockKelas.find(k => k.id === r.kelasId)?.mataPelajaranId) } as any,
                semester: mockSemesters.find(s => s.id === r.semesterId),
              }))) as T
            }
            if (parts[1] && parts.length === 2) {
              const remark = mockAcademicRemarks.find(r => r.id === parts[1])
              return ok(remark || mockAcademicRemarks[0]) as T
            }
            break
          }
          case "materi": {
            if (parts[1] === "section" && parts[2] === "kelas" && parts[3]) {
              return ok(mockMateriSections.filter(s => s.kelasId === parts[3]).map(s => ({
                ...s,
                files: [],
              }))) as T
            }
            if (parts[1] === "file" && parts[2] === "download" && parts[3]) {
              return "data:application/pdf;base64,JVBERi0xLjQK" as T
            }
            break
          }
        }
        break
      }

      // ─────────── PATCH ───────────
      case "PATCH": {
        switch (parts[0]) {
          case "auth": {
            if (parts[1] === "change-password") {
              return ok({ message: "Password berhasil diubah" }) as T
            }
            break
          }
          case "users": {
            if (parts[1]) {
              const user = mockUsers.find(u => u.id === parts[1])
              if (user) Object.assign(user, body || {})
              const authUser = mockAuthUsers.find(u => u.id === parts[1])
              if (authUser && body) {
                if (body.nama) authUser.nama = body.nama
                if (body.fullName) authUser.fullName = body.fullName
                if (body.email) authUser.email = body.email
                if (body.phoneNumber) authUser.phoneNumber = body.phoneNumber
                if (body.address) authUser.address = body.address
                if (body.cities) authUser.cities = body.cities
              }
              return ok(mockAuthUsers.find(u => u.id === parts[1]) || mockAuthUsers[0]) as T
            }
            break
          }
          case "semesters": {
            const sem = mockSemesters.find(s => s.id === parts[1])
            if (sem) Object.assign(sem, body || {})
            return ok(sem || mockSemesters[0]) as T
          }
          case "mata-pelajaran": {
            const mp = mockMataPelajaran.find(m => m.id === parts[1])
            if (mp) Object.assign(mp, body || {})
            return ok(mp || mockMataPelajaran[0]) as T
          }
          case "kelas": {
            if (!parts[2]) {
              const k = mockKelas.find(kl => kl.id === parts[1])
              if (k) Object.assign(k, body || {})
              return ok(k || mockKelas[0]) as T
            }
            break
          }
          case "nilai": {
            if (parts[1] === "komponen" && parts[2]) {
              const komp = mockNilaiKomponen.find(k => k.id === parts[2])
              if (komp) Object.assign(komp, body || {})
              return ok(komp || mockNilaiKomponen[0]) as T
            }
            if (parts[1] && parts.length === 2) {
              const entry = mockNilaiEntries.find(n => n.id === parts[1])
              if (entry && typeof body?.nilai === "number") entry.nilai = body.nilai
              return ok(mockNilaiEntries.find(n => n.id === parts[1]) || mockNilaiEntries[0]) as T
            }
            break
          }
          case "spp": {
            const spp = mockSpp.find(s => s.id === parts[1])
            if (spp) Object.assign(spp, body || {})
            return ok(spp || mockSpp[0]) as T
          }
          case "gaji": {
            const gj = mockGaji.find(g => g.id === parts[1])
            if (gj) Object.assign(gj, body || {})
            return ok(gj || mockGaji[0]) as T
          }
          case "announcement": {
            const ann = mockAnnouncements.find(a => a.id === parts[1])
            if (ann) Object.assign(ann, body || {})
            return ok(ann || mockAnnouncements[0]) as T
          }
          case "academic-remark": {
            const remark = mockAcademicRemarks.find(r => r.id === parts[1])
            if (remark && body) remark.catatan = body.catatan || remark.catatan
            return ok(remark || mockAcademicRemarks[0]) as T
          }
          case "materi": {
            if (parts[1] === "section" && parts[2]) {
              const section = mockMateriSections.find(s => s.id === parts[2])
              if (section) Object.assign(section, body || {})
              return ok(section || mockMateriSections[0]) as T
            }
            break
          }
        }
        break
      }

      // ─────────── DELETE ───────────
      case "DELETE": {
        switch (parts[0]) {
          case "users": {
            const idx = mockUsers.findIndex(u => u.id === parts[1])
            if (idx >= 0) mockUsers.splice(idx, 1)
            return ok({ message: "User berhasil dihapus" }) as T
          }
          case "semesters": {
            const si = mockSemesters.findIndex(s => s.id === parts[1])
            if (si >= 0) mockSemesters.splice(si, 1)
            return ok({ message: "Semester berhasil dihapus" }) as T
          }
          case "mata-pelajaran": {
            const mi = mockMataPelajaran.findIndex(m => m.id === parts[1])
            if (mi >= 0) mockMataPelajaran.splice(mi, 1)
            return ok({ message: "Mata pelajaran berhasil dihapus" }) as T
          }
          case "kelas": {
            if (parts[2] === "unenroll" && parts[3]) {
              return ok({ message: "User berhasil dikeluarkan dari kelas" }) as T
            }
            const ki = mockKelas.findIndex(k => k.id === parts[1])
            if (ki >= 0) mockKelas.splice(ki, 1)
            return ok({ message: "Kelas berhasil dihapus" }) as T
          }
          case "nilai": {
            if (parts[1] === "komponen" && parts[2] === "kelas" && parts[3] && parts[4]) {
              const ni = mockNilaiKomponen.findIndex(k => k.id === parts[4] && k.kelasId === parts[3])
              if (ni >= 0) mockNilaiKomponen.splice(ni, 1)
              return ok({ message: "Komponen berhasil dihapus" }) as T
            }
            break
          }
          case "spp": {
            const si2 = mockSpp.findIndex(s => s.id === parts[1])
            if (si2 >= 0) mockSpp.splice(si2, 1)
            return ok({ message: "SPP berhasil dihapus" }) as T
          }
          case "gaji": {
            const gi = mockGaji.findIndex(g => g.id === parts[1])
            if (gi >= 0) mockGaji.splice(gi, 1)
            return ok({ message: "Gaji berhasil dihapus" }) as T
          }
          case "rapor": {
            return ok({ message: "Rapor berhasil dihapus" }) as T
          }
          case "announcement": {
            const ai = mockAnnouncements.findIndex(a => a.id === parts[1])
            if (ai >= 0) mockAnnouncements.splice(ai, 1)
            return ok({ message: "Pengumuman berhasil dihapus" }) as T
          }
          case "academic-remark": {
            const ari = mockAcademicRemarks.findIndex(r => r.id === parts[1])
            if (ari >= 0) mockAcademicRemarks.splice(ari, 1)
            return ok({ message: "Catatan berhasil dihapus" }) as T
          }
          case "materi": {
            if (parts[1] === "section" && parts[2]) {
              const msi = mockMateriSections.findIndex(s => s.id === parts[2])
              if (msi >= 0) mockMateriSections.splice(msi, 1)
              return ok({ message: "Section berhasil dihapus" }) as T
            }
            if (parts[1] === "file" && parts[2]) {
              return ok({ message: "File berhasil dihapus" }) as T
            }
            break
          }
          case "auth": {
            if (parts[1] === "invitations" && parts[2]) {
              return ok({ message: "Undangan berhasil dihapus" }) as T
            }
            break
          }
        }
        break
      }

      // ─────────── PUT ───────────
      case "PUT": {
        break
      }
    }

    console.warn(`[MockAPI] Unhandled: ${method} /${cleanEndpoint}`)
    return ok(null) as T
  }

  const get = <T = any>(endpoint: string, options: Omit<ApiRequestConfig, "method" | "body"> = {}) =>
    request<T>(endpoint, { ...options, method: "GET" })

  const post = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, "method" | "body"> = {}) =>
    request<T>(endpoint, { ...options, method: "POST", body })

  const put = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, "method" | "body"> = {}) =>
    request<T>(endpoint, { ...options, method: "PUT", body })

  const patch = <T = any>(endpoint: string, body?: any, options: Omit<ApiRequestConfig, "method" | "body"> = {}) =>
    request<T>(endpoint, { ...options, method: "PATCH", body })

  const del = <T = any>(endpoint: string, options: Omit<ApiRequestConfig, "method" | "body"> = {}) =>
    request<T>(endpoint, { ...options, method: "DELETE" })

  return { request, get, post, put, patch, delete: del }
}
