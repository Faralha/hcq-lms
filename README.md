# HCQ LMS — Halaqoh Cinta Qur'an Learning Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-featured Learning Management System built for **Halaqoh Cinta Qur'an**,
an Indonesian Islamic educational institution. This project is shared as a
portfolio demonstration and is no longer actively used.

## One-Command Demo

```bash
cp .env.example .env
docker compose up -d
```

Then open **http://localhost** in your browser.

### Demo Credentials

| Role      | Email               | Password      |
|-----------|---------------------|---------------|
| Admin     | admin@hcq.com       | admin123      |
| Teacher   | pengajar@hcq.com    | pengajar123   |
| Student   | pelajar@hcq.com     | pelajar123    |

API documentation is available at http://localhost:4000/api/v1/docs

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | Nuxt 4, Vue 3, TailwindCSS 4, Pinia               |
| Backend    | NestJS 11, Prisma ORM, PostgreSQL, Bull (Redis)   |
| Storage    | MinIO (S3-compatible)                             |
| PDF        | Gotenberg + Handlebars                            |
| Auth       | JWT (Passport) + Argon2                           |
| Email      | MJML templates via SMTP                           |

## Directory Structure

```
├── backend/          # NestJS API — see backend/README.md
├── frontend/         # Nuxt 4 SPA — see frontend/README.md
├── docker-compose.yml  # Single-command demo stack
├── .env.example        # Environment template
└── LICENSE
```

## Building Images

```bash
docker build -t ghcr.io/faralha/hcq-backend:latest backend/
docker build -t ghcr.io/faralha/hcq-frontend:latest frontend/
```

## License

[MIT](LICENSE) — Copyright (c) 2025 Halaqoh-Cinta-Quran
