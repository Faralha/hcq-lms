# API Wrapper Documentation

## Struktur File

```
composables/
  ├── useApi.ts          # Global API wrapper
  └── useAuthApi.ts      # Auth-specific API wrapper

types/
  ├── api.ts             # API response & request types
  └── auth.ts            # Auth-specific types
```

## Setup

### 1. Environment Variables

Buat file `.env` di root project:

```env
NUXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 2. Nuxt Config

Sudah dikonfigurasi di `nuxt.config.ts`:

```typescript
runtimeConfig: {
  public: {
    apiBase: '', // Otomatis dibaca dari NUXT_PUBLIC_API_URL
  }
}
```

## Penggunaan

### Global API Wrapper (`useApi`)

#### GET Request

```typescript
const api = useApi();

// GET /v1/users
const users = await api.get("users");

// GET /v1/users?page=1&limit=10
const users = await api.get("users", {
  query: { page: 1, limit: 10 },
});

// GET /v2/users (custom version)
const users = await api.get("users", { version: "v2" });
```

#### POST Request

```typescript
const api = useApi();

// POST /v1/users
const newUser = await api.post("users", {
  name: "John Doe",
  email: "john@example.com",
});

// With custom headers
const result = await api.post("users", userData, {
  headers: { "X-Custom-Header": "value" },
});
```

#### PUT/PATCH Request

```typescript
const api = useApi();

// PUT /v1/users/123
await api.put("users/123", { name: "Jane Doe" });

// PATCH /v1/users/123
await api.patch("users/123", { name: "Jane Doe" });
```

#### DELETE Request

```typescript
const api = useApi();

// DELETE /v1/users/123
await api.delete("users/123");
```

### Auth API Wrapper (`useAuthApi`)

#### Login

```typescript
const authApi = useAuthApi();

try {
  const response = await authApi.login({
    email: "user@example.com",
    password: "password123",
    remember: true,
  });

  if (response.success) {
    console.log("User:", response.data?.user);
    console.log("Token:", response.data?.token);
  }
} catch (error) {
  console.error("Login failed:", error.message);
}
```

#### Register

```typescript
const authApi = useAuthApi();

try {
  const response = await authApi.register({
    fullName: "John Doe",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
    phoneNumber: "081234567890",
    city: "jakarta",
    address: "Jl. Example No. 123",
  });

  if (response.success) {
    console.log("Registration successful!");
  }
} catch (error) {
  console.error("Registration failed:", error.message);
}
```

#### Get Current User

```typescript
const authApi = useAuthApi();

const response = await authApi.getCurrentUser();
const user = response.data;
```

#### Logout

```typescript
const authApi = useAuthApi();

await authApi.logout();
```

#### Forgot Password

```typescript
const authApi = useAuthApi();

await authApi.forgotPassword({
  email: "user@example.com",
});
```

#### Reset Password

```typescript
const authApi = useAuthApi();

await authApi.resetPassword({
  token: "reset-token",
  password: "newpassword123",
  confirmPassword: "newpassword123",
});
```

## Error Handling

Semua error dari API akan di-throw dengan struktur:

```typescript
interface ApiError {
  statusCode: number; // HTTP status code
  message: string; // Error message
  errors?: Record<string, string[]>; // Validation errors
}
```

Contoh penggunaan:

```typescript
try {
  const response = await authApi.login(credentials);
} catch (error: any) {
  console.error("Status:", error.statusCode);
  console.error("Message:", error.message);

  // Validation errors
  if (error.errors) {
    console.error("Validation errors:", error.errors);
    // { email: ['Email is required'], password: ['Password must be at least 8 characters'] }
  }
}
```

## Response Structure

Semua API response mengikuti struktur:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
```

## Custom API Version

Default version adalah `v1`. Untuk menggunakan versi lain:

```typescript
const api = useApi();

// GET /v2/users
const users = await api.get("users", { version: "v2" });

// POST /v3/posts
const post = await api.post("posts", data, { version: "v3" });
```

## TRPC Integration

Untuk menggunakan TRPC server (http://localhost:3000/api/v1/trpc), Anda bisa:

1. Install TRPC client untuk Nuxt
2. Atau gunakan `useApi` untuk custom TRPC calls:

```typescript
const api = useApi();

// TRPC query
const result = await api.get("trpc/user.getById", {
  query: { input: { id: "123" } },
});
```

## Tips

### 1. Loading State

```typescript
const isLoading = ref(false);

async function fetchData() {
  isLoading.value = true;
  try {
    const data = await api.get("users");
  } finally {
    isLoading.value = false;
  }
}
```

### 2. Toast Notifications

```typescript
const toast = useToast();

try {
  const response = await authApi.login(credentials);

  toast.add({
    title: "Success",
    description: response.message,
    color: "success",
    icon: "i-lucide-check-circle",
  });
} catch (error: any) {
  toast.add({
    title: "Error",
    description: error.message,
    color: "error",
    icon: "i-lucide-alert-circle",
  });
}
```

### 3. Type Safety

Selalu gunakan TypeScript types untuk request/response:

```typescript
import type { LoginRequest, LoginResponse } from "~/types/auth";

const credentials: LoginRequest = {
  email: "user@example.com",
  password: "password123",
};

const response = await authApi.login(credentials);
const user: AuthUser = response.data?.user;
```
