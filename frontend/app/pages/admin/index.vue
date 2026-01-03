<template>
  <div class="py-4 space-y-8">

    <!-- Dashboard Greetings -->
    <div>
      <p class="text-lg font-medium ">{{ user?.role }}</p>
      <h1 class="text-3xl font-bold">Hello, {{ user?.nama ? user?.nama : 'User' }}!</h1>
      <p className="text-lg font-medium">{{ clockNow }}</p>
    </div>

    <!-- Overview -->
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <DashboardActiveSemester />
        <DashboardTotalClassesCard />
        <DashboardTotalStudentsCard />
        <DashboardTotalTeachersCard />

      </div>

      <!-- Mata Pelajaran & Upcoming Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <UPageCard title="Mata Pelajaran" :description="`${stats.totalSubjects} mata pelajaran tersedia`"
          icon="i-lucide-book-open" to="/admin/mata-pelajaran">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Klik untuk kelola →</p>
          </template>
        </UPageCard>

        <UPageCard title="Semester Mendatang" :description="stats.upcomingSemester || 'Belum ada'"
          icon="i-lucide-calendar-clock" to="/admin/semester">
          <template #footer>
            <p class="text-xs text-[--ui-text-muted]">Klik untuk kelola →</p>
          </template>
        </UPageCard>
      </div>
    </div>

    <!-- Menu Section -->
    <MenuSection title="Menu" :items="menuItems" />

    <!-- List Kelas -->
    <PengajarDaftarKelasList />
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/components/MenuSection.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  ssr: false,
})

const { user } = useAuth()
const toast = useToast()

// Composables for fetching data
const { getAllSemesters } = useSemesterApi()
const { getAllMataPelajaran } = useMataPelajaranApi()

// Dashboard stats
const stats = ref({
  upcomingSemester: '',
  totalSubjects: 0
})

// Fetch dashboard data
async function fetchDashboardStats() {
  try {
    // Fetch all data in parallel
    const [semestersRes, subjectsRes] = await Promise.all([
      getAllSemesters(),
      getAllMataPelajaran()
    ])

    const semesters = semestersRes.status === 200 && semestersRes.data ? semestersRes.data : []
    const subjects = subjectsRes.status === 200 && subjectsRes.data ? subjectsRes.data : []

    // Find active and upcoming semester
    const upcomingSemester = semesters.find(s => s.status === 'MENDATANG')

    stats.value = {
      upcomingSemester: upcomingSemester?.nama || 'Belum ada',
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
    label: 'Program',
    description: 'Atur Program',
    icon: 'i-lucide-book',
    to: '/admin/mata-pelajaran'
  },
  {
    label: 'Kelas',
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
    description: 'Atur Pengunguman',
    icon: 'i-lucide-megaphone',
    to: '/admin/announcements'
  },
  {
    label: 'Rapor',
    description: 'Atur Rapor',
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
  fetchDashboardStats()
  updateClock() // Set initial value
  const interval = setInterval(updateClock, 1000)
  // Cleanup interval saat component unmounted
  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>
