# Incident Workspace — Design & Feature Conventions

The Incident Workspace is the **reference implementation** for the operational
consoles (Responders, Emergencies, Assignments, Notifications, Audit). It uses
existing backend APIs, existing Reverb broadcasts, the existing shell, and the
existing authorization architecture. This document is the design + the
conventions every later console must follow.

## Backend contracts used (existing, unchanged)

Org-scoped under `/api/v1/organizations/{org}` (the API client sends
`X-Organization` automatically; permission `incidents.view`):

| Call | Returns |
|---|---|
| `GET incidents?status=&severity=&page=` | paginated `Incident[]` (+ `meta`) |
| `GET incidents/{id}` | `{ incident, assignment\|null, timeline[] }` (one call) |
| `GET incidents/{id}/timeline` | `timeline[]` (for targeted refetch) |

- **Incident**: `id, status(open|investigating|escalated|resolved|closed),
  severity(low|medium|high|critical), title, summary, opened_at, escalated_at,
  resolved_at, closed_at, assigned_to, emergency_id, metadata, …`
- **Timeline entry**: `{ at, type, source, payload }`.
- **Assignment**: `{ id, status, required_primary, required_supporting,
  escalation_level, responders[] }`; **responder line**:
  `{ responder_id, role, status, offered_at, accepted_at, en_route_at,
  on_scene_at, completed_at, … }`.
- **Realtime**: private channel `organizations.{org}.incidents`, events
  `incident.opened|escalated|resolved|closed`, payload `{ id, type, … }`.

> Phase scope is **read + realtime** (success criteria). Workflow transitions
> (`investigate/escalate/resolve/close`, create) exist on the backend and are
> intentionally deferred — the mutation convention is sketched below so they slot
> in without refactoring.

---

## 1–7. Design

**1. Incident List page** (`/incidents`) — `PageHeader` (title + realtime
indicator) → `IncidentFilters` → shared `DataTable` (Title, Status, Severity,
Opened, Assignee) → shared `Pagination`. Row click → detail. All data states are
delegated to `DataTable` (loading/empty/error).

**2. Incident Detail page** (`/incidents/:id`) — `PageHeader` (title, breadcrumb
`Incidents › {title}`, status+severity badges, realtime indicator). Two-column
layout: main = incident summary card + **Timeline panel**; aside = **Assignment
panel**. Single `useIncident(id)` query feeds all three (detail endpoint returns
incident + assignment + timeline together).

**3. Timeline panel** — shared generic `Timeline` fed by `timeline[]`; each entry
maps `type` → title, `payload`/`source` → description, `at` → time, `type` →
tone. Empty → shared `EmptyState`.

**4. Assignment panel** — renders the active assignment: status badge,
required primary/supporting, escalation level, and the responder lines (role +
status + key timestamps). No assignment → `EmptyState("No active assignment")`.
Read-only this phase.

**5. Incident filters** — `status` and `severity` via shared `FilterSelect`,
plus Clear. **Filter state lives in the URL** (`useSearchParams`) so views are
shareable and survive reload; the page derives the filters object from the URL
and passes it to both the query and the filter controls.

**6. Realtime update strategy** — subscribe to `organizations.{org}.incidents`
via Echo (`useIncidentsRealtime`). On any `incident.*` event, **invalidate** the
incident query tree (`queryKey ['incidents', orgId]`), which refetches the list
and any open detail (React Query refetches only mounted queries). We invalidate
rather than patch from the payload — the server stays the source of truth and we
avoid divergent client state. A `RealtimeIndicator` shows live/offline. Realtime
**degrades gracefully**: if Echo can't connect, the UI still works (refetch on
mount/refocus); nothing throws.

**7. Loading / error / empty states** — never bespoke. Lists use `DataTable`'s
built-in states; panels/pages use shared `LoadingState`, `ErrorState`
(with retry), `EmptyState`. Errors surface the API message; `ErrorState.onRetry`
calls the query's `refetch`.

---

## Conventions (the reference contract)

**Feature folder** — one module per domain under `src/features/<feature>/`:
```
api/      <feature>.types.ts   # response/domain types
          <feature>.api.ts     # endpoint module on apiClient (no logic)
          <feature>.keys.ts    # query-key factory (org-scoped)
hooks/    use<Feature>.ts      # list query
          use<Feature>Item.ts  # detail query
          use<Feature>Realtime.ts
components/ <Feature>Table.tsx, <Feature>Filters.tsx, *Panel.tsx, tone maps
pages/    <Feature>ListPage.tsx, <Feature>DetailPage.tsx
```
Feature modules **consume** shared components; they never define UI primitives.

**Query conventions** — TanStack Query. Keys are **org-scoped and hierarchical**
via a `keys` factory: `['<feature>', orgId]` → `[..., 'list', filters]` /
`[..., 'detail', id]`, so realtime can invalidate a whole tree by prefix.
Queries are `enabled` only when `activeId` is known; lists use
`placeholderData: keepPreviousData` for smooth filter/page changes. Endpoint
modules return the client's `ApiResult` (data + meta); hooks return the query.

**Table conventions** — shared `DataTable<T>` with a typed `columns` config
(`{ key, header, render, className }`), `rowKey`, `onRowClick`, and
`isLoading/error/empty/onRetry`. Columns live with the feature; the table
primitive is shared. Pagination via shared `Pagination` driven by `meta`.

**Filter conventions** — filters are URL-driven (`useSearchParams`); a typed
`Filters` object is derived from the URL and is part of the list query key.
Controls are the shared `FilterSelect`/`FilterBar`; "Clear" resets the params.

**Realtime conventions** — one `use<Feature>Realtime` hook per feature: it
subscribes to the feature's private org channel through `useOrgChannel`, and on
events **invalidates** the feature's query tree. Channel name + event list are
the only feature-specific inputs. The realtime transport is a small native
WebSocket client (`realtime/reverbClient.ts`, no laravel-echo/pusher-js)
authorized with the bearer token; absence is a no-op.

**Detail-page conventions** — prefer a single detail query that returns the
aggregate the page needs (mirror `GET incidents/{id}`). Compose `PageHeader`
(breadcrumb + badges + realtime) + shared panels. All three states handled with
shared components. Mutations (next phase) use `useMutation` + `onSuccess:
invalidate(keys.detail)`; optimistic updates only where safe.

---

## Realtime backend dependency (flagged, not implemented)

The backend defines the channels/events but does **not** call
`->withBroadcasting()` in `bootstrap/app.php`, so the `/broadcasting/auth`
endpoint for private channels likely isn't registered for a cross-origin bearer
SPA. To turn realtime on end-to-end the backend needs: (a) `withBroadcasting(
__DIR__.'/../routes/channels.php', ['middleware' => ['auth:sanctum']])` (or
equivalent), and (b) CORS for the dashboard origin on `/broadcasting/auth`. The
dashboard already implements the correct bearer authorizer and degrades
gracefully until this lands. (Same class of backend follow-up as CORS and the
`/auth/me` org-scoping item.)

## Files created / modified

**Infra**
- `package.json` — added `@tanstack/react-query` (only). Realtime uses a native
  WebSocket client — no laravel-echo / pusher-js.
- `src/lib/queryClient.ts`; `src/main.tsx` — mounted `QueryClientProvider`.
- `src/config/env.ts` + `.env.example` — Reverb config + `apiOrigin`.
- `src/realtime/reverbClient.ts` (native Pusher/Reverb WS client: connect,
  /broadcasting/auth bearer, private subscribe, ping/pong, reconnect, graceful),
  `src/realtime/useOrgChannel.ts`.

**Shared primitives (governance reference set)**
- `src/components/ui/tone.ts`
- `src/components/ui/state/{LoadingState,EmptyState,ErrorState}.tsx`
- `src/components/ui/badge/StatusBadge.tsx`
- `src/components/ui/table/DataTable.tsx`
- `src/components/ui/pagination/Pagination.tsx`
- `src/components/ui/timeline/Timeline.tsx`
- `src/components/ui/realtime/RealtimeIndicator.tsx`
- `src/components/shared/{FilterBar,FilterSelect}.tsx`

**Incidents feature** (`src/features/incidents/`)
- `api/{incidents.types,incidents.keys,incidents.api}.ts`
- `hooks/{useIncidents,useIncident,useIncidentsRealtime}.ts`
- `components/{incidentTone.ts,IncidentFilters,IncidentTable,IncidentTimelinePanel,IncidentAssignmentPanel}.tsx`
- `pages/{IncidentListPage,IncidentDetailPage}.tsx`

**Routing** — `src/App.tsx`: `/incidents` (list) + `/incidents/:id` (detail)
behind `RequirePermission` (same `incidents.view` rule as the nav).

## Testing instructions

> The sandbox blocks the npm registry, so `tsc` wasn't run here. Run locally:

```bash
cd sentrix-dashboard
cp .env.example .env       # set VITE_API_URL; optionally VITE_REVERB_* for realtime
npm install                # pulls @tanstack/react-query (realtime is dependency-free)
npm run build              # tsc -b + vite build (type-check)
npm run dev
```

Backend prerequisites: CORS for this origin (Authorization + X-Organization); for
realtime, `/broadcasting/auth` must accept the Sanctum bearer (see below).

Verify success criteria (sign in as `test@example.com` / `password`):
1. **View incidents** — sidebar → Incidents → table of the org's incidents
   (loading → rows; empty/error states render via `DataTable`).
2. **Filter** — change Status/Severity; the URL updates (`?status=…`) and the list
   refetches; Clear resets.
3. **Open detail** — click a row → `/incidents/:id`; summary + timeline + assignment
   render from a single detail query.
4. **Timeline / assignments** — timeline entries show chronologically; the
   assignment panel shows the active assignment + responder lines (or an empty
   state).
5. **Realtime** — with `VITE_REVERB_*` set and broadcasting auth configured, the
   indicator shows **Live**; opening/escalating/resolving an incident (via API)
   refreshes the list/detail without reload. Without it, the indicator shows
   **Offline** and everything still works (refetch on focus).
6. **Shell navigation** — all of the above happens inside the existing shell;
   breadcrumb `Incidents › {title}` returns to the list.

## Realtime backend dependency (unchanged from design)

Backend must register `/broadcasting/auth` for bearer SPAs —
`->withBroadcasting(__DIR__.'/../routes/channels.php', ['middleware' =>
['auth:sanctum']])` — and allow the dashboard origin via CORS. Until then the
RealtimeIndicator stays Offline and the workspace runs on query refetch. Tracked
as a backend follow-up alongside CORS and `/auth/me` org-scoping.

