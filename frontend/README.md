# HCQ LMS - Frontend

Learning Management System untuk Halaqoh Cinta Qur'an

Mode: Non SSR (Client-side only)

## 🚀 Quick Start

### Setup

Install dependencies:

```bash
pnpm install
```

### Environment Configuration

Create `.env` file:

```env
NUXT_PUBLIC_API_BASE=http://localhost:4000/api
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm run dev
```

## 📚 Documentation

### Core Documentation
- **README.md** - This file (quick start)
- **API_WRAPPER_GUIDE.md** - Complete API wrapper guide
- **API_WRAPPER_INDEX_COMPLETE.md** - Quick API reference
- **API_DOCUMENTATION.md** - Backend API specs

### Authentication & Security
- **JWT_IMPLEMENTATION.md** - JWT auth implementation details
- **MIDDLEWARE_GUIDE.md** - Middleware usage guide
- **MIDDLEWARE_SUMMARY.md** - Implementation details
- **MIDDLEWARE_DIAGRAM.md** - Visual architecture
- **TESTING_MIDDLEWARE.md** - Testing checklist

## 🔐 Authentication & Authorization

### JWT Authentication
- **Access Token** - Stored in sessionStorage, sent via `Authorization: Bearer` header
- **Refresh Token** - Stored in httpOnly cookie by backend
- **Auto Refresh** - Automatically refreshes token on 401 error
- **Secure** - XSS & CSRF protection

### Roles
- **ADMIN** - Full access to all pages
- **PENGAJAR** - Access to `/pengajar/*` only
- **PELAJAR** - Access to `/pelajar/*` only

### Protected Routes
```
/admin/*    → Admin only (middleware: ['auth', 'admin'])
/pengajar/* → Pengajar only (middleware: ['auth', 'pengajar'])
/pelajar/*  → Pelajar only (middleware: ['auth', 'pelajar'])
/auth/*     → Public (login, register)
```

### Login Flow
1. Visit `/auth/login`
2. Enter credentials
3. Backend returns user data with role
4. Frontend saves user state
5. Auto-redirect to role-specific dashboard

## 📁 Project Structure

```
app/
├── composables/          # Reusable composables
│   ├── useAuth.ts       # Auth state management
│   ├── useApi.ts        # Global API wrapper
│   ├── useAuthApi.ts    # Auth endpoints
│   ├── useUserApi.ts    # User management
│   ├── useKelasApi.ts   # Class management
│   ├── usePresensiApi.ts # Attendance
│   ├── useNilaiApi.ts   # Grading
│   ├── useMateriApi.ts  # Materials & files
│   └── ... (11 total API wrappers)
│
├── middleware/          # Route protection
│   ├── auth.ts         # Basic authentication
│   ├── admin.ts        # Admin access control
│   ├── pengajar.ts     # Pengajar access control
│   └── pelajar.ts      # Pelajar access control
│
├── pages/              # Pages & routing
│   ├── index.vue       # Auto-redirect by role
│   ├── admin/          # Admin pages
│   ├── pengajar/       # Pengajar pages
│   ├── pelajar/        # Pelajar pages
│   └── auth/           # Login & register
│
├── types/              # TypeScript types
│   ├── api.ts          # API response types
│   └── auth.ts         # Auth types + UserRole
│
├── layouts/            # Page layouts
│   ├── default.vue     # Default layout
│   └── auth.vue        # Auth layout
│
└── assets/
    └── css/
        └── main.css    # Global styles
```

## 🎯 Features

### ✅ Implemented
- ✅ API wrapper system (11 modules)
- ✅ Role-based access control (RBAC)
- ✅ Authentication middleware
- ✅ Login & Register pages
- ✅ Dashboard for each role
- ✅ TypeScript type safety
- ✅ Error handling & logging
- ✅ File upload/download support
- ✅ Toast notifications

### 🔜 Upcoming
- 🔜 Complete dashboard features
- 🔜 User management UI
- 🔜 Class management UI
- 🔜 Attendance system UI
- 🔜 Grading system UI
- 🔜 Material upload UI
- 🔜 Financial tracking UI
- 🔜 Announcements UI

## 🛠️ Tech Stack

- **Framework:** Nuxt 4.2.0
- **UI Library:** @nuxt/ui 4.1.0
- **Validation:** Zod 4.1.12
- **TypeScript:** Full type safety
- **HTTP Client:** $fetch (Nuxt native)
- **State Management:** Vue Composition API

## 🧪 Testing

See **TESTING_MIDDLEWARE.md** for complete testing guide.

### Quick Test

1. Start backend: `cd ../hcq-backend && npm run dev` (port 4000)
2. Start frontend: `pnpm run dev` (port 3001)
3. Login with different roles
4. Test access control

### Test Credentials (Backend)
```
Admin:
- email: admin@hcq.com
- password: [your admin password]

Pengajar:
- email: pengajar@hcq.com
- password: [your pengajar password]

Pelajar:
- email: pelajar@hcq.com
- password: [your pelajar password]
```

## 📦 Production

Build the application for production:

```bash
pnpm run build
```

Preview production build:

```bash
pnpm run preview
```

## 📖 API Usage Examples

### Using Auth
```typescript
const { user, isAdmin, logout } = useAuth()

if (isAdmin.value) {
  // Show admin features
}
```

### Using API Wrappers
```typescript
// Get all users (Admin)
const userApi = useUserApi()
const users = await userApi.getAllUsers()

// Start presensi (Pengajar)
const presensiApi = usePresensiApi()
const { kode } = await presensiApi.startKelas(kelasId)

// Get my nilai (Pelajar)
const nilaiApi = useNilaiApi()
const myNilai = await nilaiApi.getMyNilai()
```

### Protecting Pages
```vue
<script setup>
definePageMeta({
  middleware: ['auth', 'admin']  // or 'pengajar' or 'pelajar'
})
</script>
```

## 🐛 Troubleshooting

### "Cannot find name 'useAuth'" Error
**Normal!** TypeScript linter doesn't recognize auto-imports until dev server runs.
```bash
pnpm run dev
```

### Not Redirecting After Login
Check API response includes `role` field with value: `ADMIN`, `PENGAJAR`, or `PELAJAR`

### Middleware Not Working
Ensure backend `/auth/me` endpoint returns user data with role.

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

[Your License Here]

---

**Status:** ✅ Middleware & API Wrappers Complete
**Dev Server:** http://localhost:3001/
**Backend API:** http://localhost:4000/api/v1
**Documentation:** See markdown files in root directory
