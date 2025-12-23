<template>
  <UContainer class="py-4 space-y-8">

    <!-- Dashboard Greetings -->
    <div>
      <p class="text-lg font-medium ">{{ user?.role }}</p>
      <h1 class="text-3xl font-bold">Hello, {{ user?.nama ? user?.nama : 'User' }}!</h1>
      <p className="text-lg font-medium">{{ clockNow }}</p>
    </div>

    <!-- Overview -->
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Active Semester Card -->
        <UPageCard title="Semester Aktif" :description="stats.activeSemester || 'Tidak ada'"
          icon="i-lucide-calendar-check" variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Semester berjalan saat ini</p>
          </template>
        </UPageCard>

        <!-- Total Classes Card -->
        <UPageCard title="Total Kelas" :description="stats.totalClasses.toString()" icon="i-lucide-school"
          variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Kelas yang tersedia</p>
          </template>
        </UPageCard>

        <!-- Total Students Card -->
        <UPageCard title="Pelajar" class="max-md:hidden" :description="stats.totalStudents.toString()"
          icon="i-lucide-users" variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Pelajar terdaftar</p>
          </template>
        </UPageCard>

        <!-- Total Teachers Card -->
        <UPageCard title="Pengajar" class="max-md:hidden" :description="stats.totalTeachers.toString()"
          icon="i-lucide-user-check" variant="outline">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Pengajar aktif</p>
          </template>
        </UPageCard>
      </div>

      <!-- Mata Pelajaran & Upcoming Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <UPageCard title="Mata Pelajaran" :description="`${stats.totalSubjects} mata pelajaran tersedia`"
          icon="i-lucide-book-open" variant="soft" to="/admin/mata-pelajaran">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Klik untuk kelola →</p>
          </template>
        </UPageCard>

        <UPageCard title="Semester Mendatang" :description="stats.upcomingSemester || 'Belum ada'"
          icon="i-lucide-calendar-clock" variant="soft" to="/admin/semester">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Klik untuk kelola →</p>
          </template>
        </UPageCard>
      </div>
    </div>

    <!-- Menu Section -->
    <MenuSection title="Menu" :items="menuItems" />


  </UContainer>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { user, logout } = useAuth()
const toast = useToast()

// Composables for fetching data
const { getAllSemesters } = useSemesterApi()
const { getAllKelas } = useKelasApi()
const { getAllUsers } = useUserApi()
const { getAllMataPelajaran } = useMataPelajaranApi()

// Dashboard stats
const stats = ref({
  activeSemester: '',
  upcomingSemester: '',
  totalClasses: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalSubjects: 0
})

// Fetch dashboard data
async function fetchDashboardStats() {
  try {
    // Fetch all data in parallel
    const [semestersRes, classesRes, usersRes, subjectsRes] = await Promise.all([
      getAllSemesters(),
      getAllKelas(),
      getAllUsers(),
      getAllMataPelajaran()
    ])

    const semesters = semestersRes.status === 200 && semestersRes.data ? semestersRes.data : []
    const classes = classesRes.status === 200 && classesRes.data ? classesRes.data : []
    const users = usersRes.status === 200 && usersRes.data ? usersRes.data : []
    const subjects = subjectsRes.status === 200 && subjectsRes.data ? subjectsRes.data : []

    // Find active and upcoming semester
    const activeSemester = semesters.find(s => s.status === 'AKTIF')
    const upcomingSemester = semesters.find(s => s.status === 'MENDATANG')

    stats.value = {
      activeSemester: activeSemester?.nama || 'Tidak ada',
      upcomingSemester: upcomingSemester?.nama || 'Belum ada',
      totalClasses: classes.length,
      totalStudents: users.filter(u => u.role === 'PELAJAR').length,
      totalTeachers: users.filter(u => u.role === 'PENGAJAR').length,
      totalSubjects: subjects.length
    }
  } catch (error: any) {
    console.error('[Dashboard] Error fetching stats:', error)
    toast.add({
      title: 'Error loading dashboard',
      description: error.message || 'Failed to fetch dashboard data',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Menu items
const menuItems: MenuItem[] = [
  {
    label: 'Pengguna',
    description: 'Atur Pengguna',
    icon: 'i-lucide-users',
    to: '/admin/pengguna'
  },
  {
    label: 'Semester',
    description: 'Atur Semester',
    icon: 'i-lucide-calendar-cog',
    to: '/admin/semester'
  },
  {
    label: 'Mata Pelajaran',
    description: 'Atur Mata Pelajaran',
    icon: 'i-lucide-book',
    to: '/admin/mata-pelajaran'
  },
  {
    label: 'Enrollment',
    description: 'Atur Kelas',
    icon: 'i-lucide-calendar-plus',
    to: '/admin/kelas'
  },
  {
    label: 'Personalia',
    description: 'Atur Personalia',
    icon: 'i-lucide-banknote',
    to: '/admin/personalia'
  },
  {
    label: 'Laporan',
    description: 'Lihat Laporan',
    icon: 'i-lucide-chart-no-axes-combined',
    to: '/admin/laporan'
  },
  {
    label: 'Announcements',
    description: 'Manage Announcements',
    icon: 'i-lucide-megaphone',
    to: '/admin/announcements'
  },
  {
    label: 'Rapor',
    description: 'Manage Rapor',
    icon: 'i-lucide-file-text',
    to: '/admin/rapor'
  },
]

// Reactive clock
const clockNow = ref('')

const updateClock = () => {
  const now = new Date()
  clockNow.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// Update clock setiap detik
onMounted(() => {
  updateClock() // Set initial value
  fetchDashboardStats() // Fetch dashboard stats

  const interval = setInterval(updateClock, 1000)

  // Cleanup interval saat component unmounted
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>
