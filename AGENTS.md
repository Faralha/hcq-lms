# HCQ LMS — Agent Guide

## General

This is a Learning Management System (LMS) for **Halaqoh Cinta Qur'an**, an Indonesian Islamic educational institution.

**Tech Stack:**
- Frontend: Nuxt 4 (Vue 3, TailwindCSS, Pinia)
- Backend: NestJS 11, Prisma ORM, PostgreSQL
- Queue: Redis + Bull
- Storage: MinIO (S3-compatible)
- PDF: Gotenberg + Handlebars
- Auth: JWT (Passport) + Argon2 password hashing

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access |
| `PENGAJAR` | Teacher — manages classes, attendance, grades, materials |
| `PELAJAR` | Student — views classes, attendance, grades, report cards |

## Directory Structure

### `/backend` — NestJS API

- `src/auth/` — Authentication (JWT, refresh tokens, magic link invitations, password reset)
- `src/user/` — User CRUD
- `src/semester/` — Academic period management
- `src/mata-pelajaran/` — Subjects/courses
- `src/kelas/` — Classes, enrollment, teacher assignment
- `src/presensi/` — Attendance (6-digit session codes, manual entry)
- `src/nilai/` — Weighted grade components and grade entry
- `src/materi/` — Learning material sections & file uploads
- `src/announcement/` — Global & class-scoped announcements
- `src/spp/` — Student tuition tracking
- `src/gaji/` — Teacher salary tracking
- `src/rapor/` — Report card PDF generation (queue-based via Gotenberg)
- `src/academic-remark/` — Per-student academic notes
- `src/email/` — MJML email templates (welcome, invitations, password reset)
- `src/s3/` — MinIO/S3 file storage service
- `src/prisma/` — Prisma service module
- `prisma/schema.prisma` — Database schema (17 models)
- `prisma/seed.ts` — Database seed scripts

### `/frontend` — Nuxt 4 SPA

- `app/pages/` — Route pages organized by role (`/admin/*`, `/pengajar/*`, `/pelajar/*`, `/auth/*`, `/profile/*`)
- `app/components/` — Vue components organized by feature/role
- `app/composables/` — API composables (useAuth, useKelasApi, usePresensiApi, etc.)
- `app/stores/` — Pinia stores (auth store with persistence)
- `app/layouts/` — Page layouts (auth, landing, default, menu)
- `app/middleware/` — Route guards (auth, admin, pengajar, pelajar roles)
- `app/types/` — TypeScript type definitions
- `app/utils/` — Utility functions (form storage, Indonesian area data)
- `app/config/` — Static JSON config (footer, statistics)
- `public/` — Static assets

### `/Deployment` — Production & Dev Infrastructure

- `docker-compose.yml` — Full production stack (PostgreSQL, Redis, MinIO, Gotenberg, Caddy, backend, frontend)
- `dev/docker-compose.yml` — Dev infra (PostgreSQL, Redis, MinIO, Gotenberg, Mailpit)
- `Caddyfile` — Reverse proxy config with auto HTTPS
- `.env.example` — Environment variable template

## Important Instructions

- **ALWAYS use `pnpm`** for package management. Never use npm or yarn.
- Backend runs on port 3000 (maps to 4000 in local compose).
- Frontend runs on port 3000.
- Environment variables: see `Deployment/.env.example` or `backend/.env.example`.
- Prisma commands: `pnpm exec prisma generate`, `pnpm exec prisma migrate dev`.
- All file manipulators must use the Edit/Write tools, NOT Set-Content or similar PowerShell cmdlets.
