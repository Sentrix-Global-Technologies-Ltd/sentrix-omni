# Incident Workspace — End-to-End Verification Guide

Validate the Incident Workspace (+ Shared Shell, Authorization, Organization
Context) **before** using it as the template for the next consoles. No code
changes — this is a checklist. Two repos are involved: `sentrix-dashboard`
(this app) and `sentrix-backend` (API + Reverb).

Legend: ☐ = check · ⚠️ = known backend follow-up (not yet wired).

---

## 1. Required npm packages (dashboard)

Already declared in `package.json` — installed via `npm install`:

- ☐ `@tanstack/react-query` (^5) — server state / queries (the **only** added dep)
- ☐ existing: `react` 19, `react-dom` 19, `react-router` 7, `tailwindcss` 4, `vite` 6
- Realtime uses a **native WebSocket client** (`src/realtime/reverbClient.ts`) —
  no `laravel-echo` / `pusher-js`. If you installed those earlier, remove them:
  `npm uninstall laravel-echo pusher-js`

```bash
cd sentrix-dashboard && npm install
npm run build   # tsc -b + vite build → must pass with no type errors
```

> The build sandbox blocked the npm registry, so `tsc` has not been run yet —
> a clean `npm run build` is the first gate.

## 2. Required environment variables (dashboard `.env`)

Copy `.env.example` → `.env` and set:

- ☐ `VITE_API_URL` — backend API base incl. version, e.g. `http://localhost/api/v1`
- ☐ `VITE_DEVICE_NAME` — e.g. `Sentrix Console (web)` (login token name)
- ☐ `VITE_REVERB_APP_KEY` — must equal backend `REVERB_APP_KEY`
- ☐ `VITE_REVERB_HOST` — e.g. `localhost`
- ☐ `VITE_REVERB_PORT` — e.g. `8080`
- ☐ `VITE_REVERB_SCHEME` — `http` (local) / `https` (prod)

Reverb vars are optional: unset → app works, realtime simply disabled (Offline).

## 3. Required backend endpoints (all must respond)

Auth & context (org-scoped calls send `X-Organization` automatically):

- ☐ `POST /api/v1/auth/login` `{email,password,device_name}` → `{user,token}`
- ☐ `GET /api/v1/auth/me?with_permissions=1` → principal (roles/permissions/org)
- ☐ `POST /api/v1/auth/logout`
- ☐ `GET /api/v1/organizations` ; `POST /api/v1/organizations/{id}/switch`

Incident Workspace (permission `incidents.view`):

- ☐ `GET /api/v1/organizations/{org}/incidents?status=&severity=&page=` → paginated list
- ☐ `GET /api/v1/organizations/{org}/incidents/{id}` → `{incident, assignment, timeline}`
- ☐ `GET /api/v1/organizations/{org}/incidents/{id}/timeline` → entries

All return the envelope `{ success, message, data, (meta) }`.

## 4. Required Reverb configuration (backend)

- ☐ `laravel/reverb` installed (it is) → run the server: `php artisan reverb:start`
- ☐ `.env`: `BROADCAST_CONNECTION=reverb`
- ☐ `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` set (key matches dashboard)
- ☐ `REVERB_HOST`, `REVERB_PORT` (8080), `REVERB_SCHEME` (http) set
- ☐ **Queue worker running** — `php artisan queue:work` (or Horizon). Broadcasts are
  `ShouldBroadcast` + `afterCommit` (queued); **without a worker no realtime event
  is ever delivered**, even though the API writes succeed.

## 5. Required broadcasting configuration (backend)

- ☐ Channels defined (they are) in `routes/channels.php`:
  `organizations.{id}.incidents` → `RealtimeChannelPolicy::incidents`
  (SuperAdmin or org member with `incidents.view`, evaluated in the org team
  context — so org users authorize correctly here).
- ⚠️ **`/broadcasting/auth` endpoint for bearer SPAs is not registered.**
  `bootstrap/app.php` passes `channels:` to `withRouting` but does **not** call
  `->withBroadcasting(__DIR__.'/../routes/channels.php', ['middleware' =>
  ['auth:sanctum']])`. Private-channel subscription will 403/404 until this is
  added. The dashboard already sends the bearer to `${VITE_API_URL-origin}/broadcasting/auth`.
- Event contract the dashboard listens for: private channel
  `organizations.{org}.incidents`, events `incident.opened|escalated|resolved|closed`,
  payload `{ id, type, … }`.

## 6. Required CORS configuration (backend)

The dashboard is a **separate origin** using bearer tokens.

- ⚠️ No `config/cors.php` is published. Publish/configure it so cross-origin works:
  - ☐ `paths`: include `api/*` **and** `broadcasting/auth`
  - ☐ `allowed_origins`: the dashboard origin (e.g. `http://localhost:5173`) —
    avoid `*` in production
  - ☐ `allowed_headers`: include `Authorization`, `X-Organization`, `Content-Type`, `Accept`
  - ☐ `allowed_methods`: `['*']` (GET/POST/PATCH/DELETE/OPTIONS)
  - ☐ `supports_credentials`: `false` (bearer tokens, not cookies)
- ☐ Confirm preflight `OPTIONS` succeeds for `GET /api/v1/...` from the dashboard origin.

## 7. Required seed / test data (backend)

- ☐ `php artisan migrate:fresh --seed` — runs `PermissionCatalogueSeeder`,
  `MonitoringOrganizationSeeder`, and `DemoOperationsSeeder`.
- `DemoOperationsSeeder` (idempotent) provisions the demo org with **responders,
  incidents (+ timelines), an emergency, and an active dispatch assignment** — i.e.
  everything the workspace renders. ✅ no manual data needed for the happy path.
- Demo users (password `password`):
  - ☐ `admin@sentrix.test` — **SuperAdmin** (sees all nav incl. SuperAdmin)
  - ☐ `test@example.com` — **OrganizationAdmin** of the demo org (Operations nav)
- To generate a fresh realtime event during testing (Step 5 below), transition an
  incident via API, e.g. `POST /api/v1/organizations/{org}/incidents/{id}/escalate`
  (needs `incidents.escalate`; use the SuperAdmin token).

## 8. Manual test scenarios

Run backend (`sail up`, `reverb:start`, `queue:work`) + dashboard (`npm run dev`).

**A. Auth & shell**
1. ☐ Visit `/` while signed out → redirected to `/signin`.
2. ☐ Sign in as `test@example.com` → lands on dashboard; header shows the org;
   user menu shows name/email; sign-out returns to `/signin`.
3. ☐ Sign in as `admin@sentrix.test` → sidebar additionally shows the
   **SuperAdmin** group.

**B. Authorization (nav + routes)**
4. ☐ As the org user, sidebar shows **Operations → Incidents**; visiting
   `/superadmin` directly renders the in-shell **Forbidden** page.
5. ☐ As SuperAdmin, `/superadmin` renders (placeholder), proving gating is by identity.

**C. Incident list**
6. ☐ Sidebar → Incidents → table lists the demo org's incidents (title, status
   badge, severity badge, opened time).
7. ☐ Loading shows the spinner state; if the API is stopped, the table shows the
   **error** state with Retry; an org with no incidents shows the **empty** state.
8. ☐ Filter by Status / Severity → URL updates (`?status=open`) and list refetches;
   **Clear** resets; reload preserves the filter (URL-driven).

**D. Incident detail**
9. ☐ Click a row → `/incidents/:id`; breadcrumb `Incidents › {title}`; status +
   severity badges in the header.
10. ☐ **Summary** card shows opened/escalated/resolved/closed times.
11. ☐ **Timeline** panel lists entries chronologically (seeded incidents have them).
12. ☐ **Assignment** panel shows the active assignment + responder lines; an
    incident without one shows the empty state.

**E. Organization context**
13. ☐ Network tab: every `organizations/{org}/...` request carries the
    `X-Organization` header.
14. ☐ (Multi-org user) the switcher lists orgs; switching re-hydrates identity and
    the incident list reloads for the new org.

**F. Realtime** (requires §4 worker + §5 broadcasting/auth + §6 CORS)
15. ☐ Indicator shows **Live** on the list/detail.
16. ☐ With the list open, `POST .../incidents/{id}/escalate` (SuperAdmin) → the
    list/detail update within ~1s **without reload**; the incident's status badge
    flips to Escalated.
17. ☐ Stop Reverb (or unset `VITE_REVERB_*`) → indicator shows **Offline** and the
    workspace still works (data refetches on focus). No console errors.

**G. Session resilience**
18. ☐ Hard-refresh on `/incidents` → silent re-auth from the session token; page
    re-renders without bouncing to login.
19. ☐ Revoke the token (or `POST /auth/logout` elsewhere) then act → a 401 triggers
    automatic logout to `/signin`.

---

## Outcome / gates before templating

Treat the Incident Workspace as the console template **once**:
`npm run build` passes (1), A–E all green (no backend changes needed for these),
and F is green after the three backend follow-ups land:
**(i)** register `/broadcasting/auth` for `auth:sanctum`, **(ii)** publish/configure
CORS incl. `broadcasting/auth`, **(iii)** run a queue worker. Item (i) and (ii),
plus the previously-accepted `/auth/me` org-scoping, are the outstanding backend
tasks; none block A–E.
