# Sentrix Console — Role-Aware Application Shell

Phase deliverable: a permission-aware, organization-scoped application shell.
Built by **extending** the TailAdmin template (per `governing-guide.md`) — the
template's layout, navigation pattern, design-system classes, theming and
responsiveness are preserved; new behavior lives in shared layers. **No
operational/feature screens were built** — navigation destinations render a
shared placeholder.

---

## 1. Authorization architecture

**Principle:** the Sentrix backend is the single source of truth for RBAC and
authorizes every API call. The dashboard never re-implements RBAC; it only
decides what shell/nav to **show**, from the identity returned by
`GET /api/v1/auth/me` (`roles`, `permissions`, org context). SuperAdmin is
allow-all, mirroring the backend's `Gate::before`.

**Pieces**
- `src/authz/access.ts` — `AccessRule` (`anyPermission` / `anyRole` /
  `superAdminOnly` / `orgMemberFallback`) + `isAllowed(rule, principal)`.
  Permission keys are the real backend `DefaultPermission` values
  (`incidents.view`, `emergencies.view`, `responders.view`, `assignments.view`,
  `audit.view`, …).
- `src/hooks/useAuthz.ts` — `can / canAny / hasRole / isSuperAdmin / isOrgMember
  / isAllowed`, derived from the principal.
- `src/components/shared/Can.tsx` — permission-aware **rendering** gate:
  `<Can permission="incidents.view">…</Can>`.
- `src/routes/RequirePermission.tsx` — route-level guard (defense-in-depth) that
  shows the in-shell `Forbidden` page when the rule isn't met.

**Important backend finding (carried from earlier audit).** The backend has
Spatie **teams enabled**, but `GET /auth/me` is **not** org-team-scoped, so an
org member's *org-scoped* permissions come back empty there. Until `/auth/me`
honors org context (small backend follow-up — documented, not done here), gating
operational sections purely on permissions would hide them from legitimate org
users. So operational items also carry `orgMemberFallback: true`. The moment the
backend returns org-scoped permissions, removing that flag yields exact
per-permission nav with **no other change**. SuperAdmin and the backend's
per-action enforcement are unaffected.

**Result (success criterion):** users see only the nav/shell they're authorized
for — SuperAdmin sees everything incl. the SuperAdmin section; org members see
Operations + Notifications + Settings; non-privileged users see only Dashboard /
Notifications / Settings. Empty groups are hidden entirely.

## 2. Navigation architecture

- **Single source of truth:** `src/config/navigation.tsx` — groups
  (Overview / Operations / Monitoring / System) → items, each with `path`,
  `icon` (from `src/icons`), and an optional `access` rule. Also exports
  `accessByPath`, reused by the route guards so **nav visibility and route
  enforcement can't drift**.
- **Sidebar:** `src/layout/AppSidebar.tsx` extends the template sidebar
  (collapse / hover-expand / mobile drawer, `menu-item*` classes) but renders
  from the config filtered by `useAuthz().isAllowed`, hiding empty groups.
- **Destinations wired:** Dashboard, Incidents, Emergencies, Responders,
  Assignments, Notifications, Audit, Settings, SuperAdmin. Each routes to the
  shared `Placeholder` (shell, not content) and (where gated) sits behind
  `RequirePermission`.

## 3. Organization-context architecture

- `src/context/OrganizationContext.tsx` — centralizes org context: `current`,
  `organizations`, `activeId`, `canSwitch`, `switching`, `switchOrganization()`.
  Derived from the principal; **owns the `X-Organization` header** on the API
  client (via an effect on `activeId`) so **every API request carries org
  context**. `switchOrganization` sets the header, calls
  `POST /organizations/{id}/switch`, then re-hydrates identity (`AuthContext.refresh()`).
- `src/components/shared/OrganizationSwitcher.tsx` — header control: static label
  for single-org users, dropdown for multi-org (built for multi-organization
  users from day one).
- `src/services/api/organizations.ts` — `list()` + `switch()`.

## 4. Files created / modified

**Created**
- `src/authz/access.ts`, `src/hooks/useAuthz.ts`
- `src/components/shared/Can.tsx`, `Breadcrumb.tsx`, `PageHeader.tsx`,
  `GlobalSearch.tsx`, `ComingSoon.tsx`, `OrganizationSwitcher.tsx`
- `src/context/OrganizationContext.tsx`
- `src/services/api/organizations.ts`
- `src/config/navigation.tsx`
- `src/routes/RequirePermission.tsx`
- `src/pages/OtherPage/Forbidden.tsx`, `src/pages/Placeholder.tsx`

**Modified**
- `src/context/AuthContext.tsx` — added `refresh()`; handed `X-Organization`
  ownership to OrganizationProvider.
- `src/layout/AppSidebar.tsx` — role-aware, config-driven (extends template).
- `src/layout/AppHeader.tsx` — added OrganizationSwitcher; extracted search to
  `GlobalSearch`; kept NotificationDropdown as the notification entry point.
- `src/App.tsx` — section routes + guards; template demo pages kept (off-nav).
- `src/main.tsx` — mounted `OrganizationProvider` inside `AuthProvider`.

**Shared components delivered (governance):** Sidebar groups, permission-aware
menu items (sidebar filter + `Can`), Breadcrumb system, Page header system,
Organization switcher, Global search placeholder, Notification entry point
(existing `NotificationDropdown`).

## 5. Testing instructions

> Registry access is restricted in the build sandbox, so `tsc` could not be run
> here. Run locally:

```bash
cd sentrix-dashboard
cp .env.example .env          # VITE_API_URL -> your backend /api/v1
npm install
npm run build                 # tsc -b + vite build (type-check)
npm run dev
```

Backend must allow this origin via **CORS** (Authorization + X-Organization
headers). Then verify the success criterion with the seeded users:

1. **SuperAdmin** (`admin@sentrix.test` / `password`): sign in → sidebar shows
   **all** groups incl. **System → SuperAdmin**. Visiting `/superadmin` renders
   the placeholder (not Forbidden).
2. **Org user** (`test@example.com` / `password`): sidebar shows
   **Operations** (Incidents/Emergencies/Responders/Assignments) +
   Notifications + Settings; **no SuperAdmin** item. Manually visiting
   `/superadmin` shows the in-shell **Forbidden** page (route guard).
3. **Org context:** the user dropdown badge and header show the current org;
   network calls include the `X-Organization` header (DevTools → Network).
   With >1 org, the switcher lists them and switching re-hydrates identity.
4. **Empty groups hidden:** a user with no access to a group's items never sees
   that group heading.
5. **Auth still holds:** signing out returns to `/signin`; a 401 mid-session
   auto-logs-out (from the Phase-1 auth layer).

## Notes / next
- Removing `orgMemberFallback` (in `authz/access.ts` usages) once `/auth/me` is
  org-scoped yields exact per-permission nav — no UI change needed.
- Operational screens (Incidents list, etc.) are the next phase; they compose
  `PageHeader` + shared components and consume their endpoint modules.
