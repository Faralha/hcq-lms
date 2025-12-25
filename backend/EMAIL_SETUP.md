# Email Configuration dengan Mailpit

Implementasi email menggunakan `@nestjs-modules/mailer` dengan Mailpit untuk testing lokal.

## Setup Mailpit

### Menggunakan Docker (Recommended)

1. Tambahkan service Mailpit ke `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mailpit:
    image: axllent/mailpit:latest
    container_name: hcq-mailpit
    ports:
      - '1025:1025' # SMTP port
      - '8025:8025' # Web UI port
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
    networks:
      - hcq-network

networks:
  hcq-network:
    driver: bridge
```

2. Jalankan Docker Compose:

```bash
docker-compose up -d mailpit
```

3. Akses Web UI Mailpit: http://localhost:8025

### Instalasi Local (tanpa Docker)

Download dari: https://github.com/axllent/mailpit

## Environment Variables

Tambahkan ke `.env`:

```bash
# Email Configuration (Mailpit)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_IGNORE_TLS=true
EMAIL_FROM="No Reply <noreply@hcq.com>"
FRONTEND_URL=http://localhost:3000
```

### Konfigurasi untuk Docker Container

Jika NestJS jalan di dalam Docker container yang sama dengan Mailpit:

```bash
EMAIL_HOST=mailpit
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_IGNORE_TLS=true
EMAIL_FROM="No Reply <noreply@hcq.com>"
FRONTEND_URL=http://localhost:3000
```

## Production Configuration

Untuk production, gunakan email service yang sebenarnya dengan konfigurasi:

```bash
# Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_IGNORE_TLS=false
EMAIL_FROM="Support <support@hcq.com>"

# Custom SMTP
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_IGNORE_TLS=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM="Support <support@hcq.com>"
```

## Features

✅ Magic link untuk registrasi pengajar  
✅ Welcome email setelah registrasi  
✅ HTML template dengan styling profesional  
✅ Link expiration (7 hari)  
✅ Error handling & logging  
✅ Support untuk Mailpit (local) dan SMTP service (production)

## API Endpoints

### POST /auth/pengajar/invite

**Request:**

```json
{
  "email": "teacher@example.com"
}
```

**Response:**

```json
{
  "message": "Invitation created and sent successfully",
  "email": "teacher@example.com",
  "expiresAt": "2025-12-31T12:00:00Z"
}
```

Email dengan magic link akan dikirim ke alamat yang ditentukan.

### POST /auth/pengajar/register

**Request:**

```json
{
  "email": "teacher@example.com",
  "password": "SecurePassword123!",
  "nama": "John",
  "fullName": "John Doe",
  "cities": "Jakarta",
  "address": "Jl. Example No. 123",
  "phoneNumber": "081234567890",
  "token": "magic-link-token-from-email"
}
```

**Response:**

```json
{
  "message": "Teacher registered successfully",
  "user": {
    "id": "user-id",
    "email": "teacher@example.com",
    "nama": "John",
    "fullName": "John Doe",
    "cities": "Jakarta",
    "address": "Jl. Example No. 123",
    "phoneNumber": "081234567890",
    "role": "PENGAJAR",
    "createdAt": "2025-12-24T12:00:00Z"
  }
}
```

Welcome email akan dikirim ke alamat pengajar.

## Testing Email

1. Jalankan aplikasi:

```bash
pnpm start:dev
```

2. Test API pengajar invitation:

```bash
curl -X POST http://localhost:3000/auth/pengajar/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com"}'
```

3. Buka Web UI Mailpit: http://localhost:8025
4. Email yang dikirim akan muncul di Mailpit
5. Klik email untuk melihat preview dan copy magic link

## Troubleshooting

### Error: connect ECONNREFUSED 127.0.0.1:1025

- Pastikan Mailpit running
- Periksa `EMAIL_HOST` dan `EMAIL_PORT` di `.env`
- Jika di Docker: Gunakan `mailpit` sebagai host, bukan `localhost`

### Email tidak terkirim tapi tidak ada error

1. Periksa logs: `pnpm start:dev`
2. Pastikan `EMAIL_FROM` format benar: `"Name <email@domain.com>"`
3. Verifikasi konfigurasi di `src/email/email.module.ts`

### Mailpit Web UI tidak accessible

- Pastikan port 8025 tidak ter-block
- Cek Docker container: `docker ps | grep mailpit`
- Restart: `docker-compose restart mailpit`
