# Shared Action Architecture (P0 operational actions)

The contract for turning read-only consoles into actionable ones. Every write
action across Incidents, Emergencies, Assignments, Responders (and future
consoles) follows this — **no page-specific action patterns**. Uses existing
backend endpoints only.

## 1. Mutation conventions

- Per feature: a `use<Feature>Actions(id)` hook. Each action is a TanStack
  **`useMutation`** whose `mutationFn` calls the feature's endpoint module (thin
  wrapper over `apiClient`). No business logic client-side — the backend owns the
  rules (status guards, permissions).
- **`onSuccess` invalidates the feature's query tree** (`<feature>Keys.all(org)`),
  which refetches the open detail + any mounted list. The UI consumes
  `mutateAsync` so the action button can await it.
- Endpoint modules gain the action methods (e.g. `incidentsApi.escalate(org,id)`).

## 2. Confirmation dialog architecture

- Shared **`ConfirmDialog`** (built on the existing `ui/modal` `Modal`): title,
  description, optional `children` (form fields), Cancel + Confirm, a `tone`
  (`primary` | `danger`), and a `loading` state.
- Shared **`ConfirmActionButton`** = the whole pattern in one component: a gated
  trigger button → opens `ConfirmDialog` → runs `onConfirm()` (a `mutateAsync`)
  → toast + close on success, toast + stay-open on error. Destructive actions use
  `tone="danger"`.
- Actions that need input (emergency resolution text, responder target status)
  pass their fields as `children`; the parent owns the field state and reads it in
  `onConfirm`. **One dialog component for everything.**

## 3. Permission gating

- Every action is wrapped in `<Can permission="…">` (UX gating only). Action →
  permission map: incidents `update/escalate/resolve(+close)`; emergencies
  `acknowledge/resolve(+cancel)`; assignments `cancel`, `dispatch(complete)`;
  responders `manage` (status).
- **Backend is authoritative** — it re-checks every action and returns `403`,
  surfaced as an error toast. The UI gate only hides buttons.
- **State gating** complements permissions: each feature has a small
  `availableActions(entity)` helper so only valid transitions show (e.g. no
  "Resolve" on a closed incident).
- **Exact gating is now active.** `/auth/me` is org-team-scoped on the backend, so
  the principal's permissions are accurate per organization. The temporary
  `orgMemberFallback` has been removed from the nav items and the action gates —
  buttons now show strictly by permission (e.g. a Responder sees view, not
  escalate). The `orgMemberFallback` capability remains in `authz/access` for
  future use but is no longer applied.

## 4. Realtime update strategy

- **Server-confirmed invalidation is the source of truth:** on mutation success
  we invalidate and refetch. Realtime broadcasts (e.g. `incident.escalated`) also
  invalidate the same tree, so *other* operators see the change live; TanStack
  Query dedupes the overlap. We never patch client state from the action result.

## 5. Success / error feedback

- Shared **Toast** system (`ToastProvider` + `useToast`, no dependency): a success
  toast on completion (`"Incident escalated"`), an error toast carrying the API
  message on failure (`ApiError.message`, incl. 422 validation text and 403).
- The confirm dialog **closes on success** and **stays open on error** so the
  operator can adjust/retry. Buttons disable while in flight.

## 6. Optimistic vs server-confirmed

- **All P0 actions are server-confirmed** (no optimistic updates). They're
  safety-critical, state-guarded, and frequently irreversible (escalate, resolve,
  cancel, complete, suspend) — showing a state the server might reject is unsafe.
  We await the API and invalidate.
- Optimistic updates are reserved for trivial, reversible, non-critical toggles
  (none in P0). If introduced later, they must include rollback on error.

---

### Files this introduces
`components/shared/toast/*` (ToastProvider, useToast), `components/shared/ConfirmDialog.tsx`,
`components/shared/ConfirmActionButton.tsx`; per feature `hooks/use<Feature>Actions.ts`,
action methods on `api/*.api.ts`, and a state helper + an action bar on each
detail page.
