# Sentrix Console — Authentication

The dashboard authenticates against the **existing** Sentrix backend contract.
No backend changes were required to ship this. This document describes what is
implemented today and the migration path to a hardened token model later.

---

## Current implementation (Phase 1)

**Model:** long-lived **Sanctum bearer token**, obtained at login and stored in
**`sessionStorage`** (tab-scoped; cleared when the tab closes).

**Backend contract used (unchanged):**

| Call | Purpose |
|---|---|
| `POST /api/v1/auth/login` `{ email, password, device_name }` | Returns `data: { user, token }` (token issued because `device_name` is sent) |
| `GET /api/v1/auth/me?with_permissions=1` | The principal (roles + permissions + org context) |
| `POST /api/v1/auth/logout` (Bearer) | Revokes the current token |

**Flow**
1. `SignInForm` → `useAuth().login(email, password)` → `authApi.login`.
2. The token is saved to `sessionStorage`; the principal is hydrated via `auth/me`.
3. `AuthContext` exposes `status` (`loading | authenticated | unauthenticated`),
   `principal`, `login`, `logout`.
4. On a hard reload, `AuthContext` bootstraps: if a token exists it re-validates
   it by calling `auth/me`; otherwise the user is unauthenticated.
5. **Automatic logout on token invalidation:** the API client clears the token
   and notifies `AuthContext` on **any `401`**, flipping status to
   `unauthenticated`; `ProtectedRoute` then redirects to `/signin`.
6. `logout()` calls `auth/logout` (best-effort) and clears local state.

**Where it lives**
```
src/config/env.ts              # VITE_API_URL, device name
src/services/api/
  client.ts                    # fetch gateway: bearer header, envelope unwrap, 401 hook
  tokenStorage.ts              # sessionStorage token (get/set/clear)
  errors.ts                    # typed ApiError hierarchy
  types.ts                     # Envelope, Principal, LoginResponse
  auth.ts                      # authApi.login / me / logout
src/lib/principal.ts           # isSuperAdmin / hasRole / hasPermission helpers (UX only)
src/context/AuthContext.tsx    # session owner (bootstrap, login, logout, 401 handler)
src/routes/ProtectedRoute.tsx  # gate for authenticated areas
src/routes/GuestRoute.tsx      # gate for /signin
```

**Deployment note (separate origins):** the API is on a different origin, so the
backend must allow this dashboard's origin via **CORS** (Allow-Origin + the
`Authorization` and `X-Organization` request headers). Set `VITE_API_URL` in
`.env` (see `.env.example`).

---

## Known limitations (accepted for now)

- **Long-lived tokens.** The backend issues non-expiring Sanctum tokens. A stolen
  token is valid until logout/revocation. `sessionStorage` (vs. localStorage)
  limits persistence to the tab, which reduces but does not eliminate XSS risk.
- **No silent refresh.** There is no refresh endpoint, so the session simply ends
  when the token is revoked/invalid (handled gracefully via auto-logout).
- **Single device token name.** Login revokes prior tokens with the same
  `device_name` (`Sentrix Console (web)`), so a new sign-in supersedes the old.

These are deliberate trade-offs to **unblock dashboard development** without
waiting on backend auth changes.

---

## Future migration path (backend changes required — NOT implemented here)

Goal: short-lived access tokens + refresh tokens + rotation + silent refresh,
moving the access token fully **in-memory**. The dashboard was structured so this
is isolated to `AuthContext` + `services/api/*`.

**Backend prerequisites (in `sentrix-backend`)**
1. **Short-lived access tokens** — set Sanctum `expiration` (e.g. 15 min) or
   issue access tokens with an `expires_at`.
2. **Refresh endpoint** — e.g. `POST /api/v1/auth/refresh` that accepts a valid
   refresh credential and returns a new access token.
3. **Refresh tokens + rotation** — issue a long-lived, single-use refresh token
   at login; rotate (invalidate old, issue new) on every refresh; support
   server-side revocation. (Sanctum has none of this natively — it needs a small
   custom token table/flow or a package.)
4. **Delivery of the refresh credential** given separate origins — decide between
   an httpOnly `SameSite=None; Secure` cookie on the API origin (note: fragile
   under third-party-cookie deprecation) vs. a rotating refresh token returned in
   the response body.

**Dashboard changes when the above lands**
1. Move the **access token in-memory** (a module variable), not `sessionStorage`.
2. Add an **`authApi.refresh()`** call and a response interceptor in `client.ts`:
   on `401`, attempt **refresh once**, retry the original request, else logout.
3. **Bootstrap via refresh** on app load instead of reading a stored token.
4. Keep `AuthContext`'s public surface (`status / principal / login / logout`)
   identical so pages and guards don't change.

Because today's design already centralizes the token in `tokenStorage` + the 401
handling in `client.ts`, this migration touches only those two files plus
`AuthContext` — no page or route changes.
