# Refresh Token Issue - Diagnosis & Solution

## Problem Summary

Error yang terjadi:

```
[API] 401 Unauthorized - Attempting token refresh
[API] Current cookies: <empty string>
[API] Refresh response: { accessToken: "...", user: {...} }
[API] Token refreshed successfully
[API] Token refresh failed: FetchError: [POST] ".../auth/refresh": 500 Internal Server Error
```

## Root Cause

**Refresh token cookie tidak ada atau tidak dikirim ke backend.**

### Kemungkinan Penyebab:

1. **Cookie Expired** (7 hari sejak login terakhir)
2. **Browser cleared cookies**
3. **Cookie tidak di-set saat login** karena response dari backend tidak meng-include `Set-Cookie` header
4. **SameSite policy issue** - Cookie dengan `SameSite=Strict` tidak dikirim dalam cross-origin request (localhost:3000 → localhost:4000)

## Backend Expected Behavior

Menurut API documentation, backend seharusnya:

1. **Login** - Returns access token + sets refresh token as HTTP-only cookie:

   ```
   Set-Cookie: refreshToken=a1b2c3d4...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
   ```

2. **Refresh** - Reads refresh token from cookie, returns new tokens:

   ```
   POST /api/v1/auth/refresh
   Cookie: refreshToken=a1b2c3d4...

   Response: { accessToken: "...", user: {...} }
   Set-Cookie: refreshToken=x9y8z7...; (new token)
   ```

## Why 500 Error?

Backend returns 500 when:

- Refresh token not found in cookies
- Refresh token invalid/expired
- Database error when validating token

## Frontend Fixes Applied

### 1. ✅ Always Send Credentials

```typescript
const fetchOptions: any = {
  method,
  headers: requestHeaders,
  credentials: "include", // Always include credentials for cookies
};
```

**Before**: Only sent credentials on client-side conditionally
**After**: Always send credentials to ensure cookies are included

### 2. ✅ Better Error Handling

```typescript
} catch (refreshError: any) {
  console.error('[API] Token refresh failed:', refreshError)
  console.error('[API] Refresh error status:', refreshError?.statusCode)
  console.error('[API] Refresh error data:', refreshError?.data)

  // Clear tokens and redirect to login
  const { clearTokens } = useTokens()
  clearTokens()

  navigateTo('/auth/login')
}
```

**Added**: Better logging and forced redirect to login page when refresh fails

### 3. ✅ Removed Backend Bug Workaround

**Removed**: Code yang mencoba handle backend returning 401 with valid data
**Why**: This was masking the real issue - cookie not being sent

## Recommended Backend Fix

Jika masalah persist, backend perlu di-update:

### Option 1: Use `SameSite=Lax` for Development

```typescript
// In NestJS auth controller
response.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅ Lax for dev
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});
```

### Option 2: Use Same Port (Proxy)

Configure Nuxt to proxy API requests:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    devProxy: {
      "/api": {
        target: "http://localhost:4000/api",
        changeOrigin: true,
      },
    },
  },
});
```

Then use `/api/v1/login` instead of `http://localhost:4000/api/v1/login`

## Testing Steps

1. **Clear browser cookies**: DevTools → Application → Cookies → Clear all
2. **Login**: Go to `/auth/login` and login with valid credentials
3. **Check cookies**: DevTools → Application → Cookies → Check if `refreshToken` exists
4. **Wait for access token to expire** (15 minutes) OR manually remove access token from sessionStorage
5. **Make an API call**: Should automatically refresh and work
6. **Check logs**: Should see `[API] Token refreshed successfully`

## Debug Checklist

- [ ] Check if `refreshToken` cookie exists after login (DevTools → Application → Cookies)
- [ ] Check cookie domain, path, and SameSite settings
- [ ] Verify `credentials: 'include'` is set in all $fetch calls
- [ ] Check backend logs for incoming Cookie header
- [ ] Verify backend is setting cookie with correct domain (localhost, not 127.0.0.1)
- [ ] Test with `SameSite=Lax` or `SameSite=None; Secure` in backend

## Current Status

✅ Frontend properly sends `credentials: 'include'`
✅ Frontend handles refresh token flow correctly
❌ Backend returns 500 when cookie not found (should return 401 with proper message)
⚠️ Need to verify cookie is actually set after login

## Next Steps

1. **Login fresh** and check if cookie exists
2. If cookie exists but not sent → Backend needs `SameSite=Lax` for dev
3. If cookie not set at all → Backend issue with Set-Cookie header
4. Consider using proxy to avoid cross-origin cookie issues

---

**Last Updated**: November 7, 2025
**Status**: Investigating - Frontend fixes applied, awaiting testing
