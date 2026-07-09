# Local Runbook — Run Backend + Dashboard and Verify

Companion to `docs/VERIFICATION.md`. This is the exact, step-by-step setup to get
the **Sentrix backend (Docker/Laravel Sail)** and the **dashboard (Vite)** running
locally so you can execute the A–G scenarios. Two terminals minimum.

Where values come from, in one sentence: **service hostnames** (`pgsql`, `redis`,
`mailpit`) are the Docker **service names** from `compose.yaml` (containers talk to
each other by name); **DB credentials** are the Sail convention (`sail` /
`password`); **Reverb keys** are local secrets **you choose** (any strings, as long
as backend and dashboard match); **ports** are the ones the compose file forwards.

---

## 0. Prerequisites

- Docker Desktop running.
- Node 20+ (for the dashboard).
- Backend dependencies already vendored (you've run Sail/tests before, so
  `vendor/` exists). If not: `docker run --rm -v "$(pwd)":/app -w /app laravelsail/php84-composer:latest composer install`.

---

## 1. Backend `.env` (sentrix-backend)

```bash
cd sentrix-backend
cp .env.example .env     # if you don't have a .env yet
```

Set/confirm these values (the shipped `.env.example` defaults DB to sqlite — switch
it to Postgres because the app uses PostGIS):

```dotenv
APP_URL=http://localhost

# --- Database: the pgsql (PostGIS) container in compose.yaml ---
DB_CONNECTION=pgsql
DB_HOST=pgsql            # the compose service name (NOT 127.0.0.1)
DB_PORT=5432
DB_DATABASE=sentrix      # any name; the container creates it on first boot
DB_USERNAME=sail         # Sail convention
DB_PASSWORD=password     # Sail convention

# --- Redis: the redis container in compose.yaml ---
REDIS_CLIENT=phpredis
REDIS_HOST=redis         # the compose service name
REDIS_PORT=6379
REDIS_PASSWORD=null

# --- These just say "use the Redis configured above"; no external values ---
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# --- Realtime (Reverb is self-hosted; pick any matching secrets) ---
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=sentrix-local
REVERB_APP_KEY=sentrix-local-key
REVERB_APP_SECRET=sentrix-local-secret
REVERB_HOST=localhost    # what the browser connects to
REVERB_PORT=8080
REVERB_SCHEME=http

# --- Mail (optional; mailpit container catches outgoing mail) ---
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

> **Where do the Reverb keys come from?** They're not issued by anyone — Reverb is
> your own WebSocket server. For local dev just invent the three values above. The
> only rule: the dashboard's `VITE_REVERB_APP_KEY` must equal the backend's
> `REVERB_APP_KEY`. (Alternatively run `./vendor/bin/sail artisan install:broadcasting`
> to have Laravel generate them for you.)

> **Why service names, not 127.0.0.1?** Inside Docker, the app container reaches
> Postgres/Redis over the `sail` network using the **service name** (`pgsql`,
> `redis`). `127.0.0.1` would point at the app container itself.

## 2. Start the backend stack

```bash
# (optional) make the sail command shorter:
alias sail='./vendor/bin/sail'

sail up -d                      # boots laravel.test (app:80), pgsql, redis, mailpit
sail artisan key:generate       # only once, if APP_KEY is empty
sail artisan migrate:fresh --seed
```

`migrate:fresh --seed` runs `PermissionCatalogueSeeder`, `MonitoringOrganizationSeeder`,
and `DemoOperationsSeeder` — the last one creates the demo org with **incidents,
timelines, an active assignment, and responders**, so the workspace has data.

Then, in **separate terminals** (each keeps running):

```bash
sail artisan queue:work         # REQUIRED for realtime — broadcasts are queued
sail artisan reverb:start --host=0.0.0.0 --port=8080   # the WebSocket server
```

> `--host=0.0.0.0` makes Reverb reachable from your host browser (not just inside
> the container).

## 3. Confirm the backend is up

```bash
curl -i http://localhost/up                       # health check → HTTP 200
curl -s -X POST http://localhost/api/v1/auth/login \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"email":"test@example.com","password":"password","device_name":"curl"}'
# → JSON with data.token and data.user
```

Seeded logins (password `password`):
- `admin@sentrix.test` — SuperAdmin (sees everything incl. SuperAdmin nav)
- `test@example.com` — OrganizationAdmin of the demo org (has incidents)

Mailpit UI (if you need it): http://localhost:8025

## 4. Dashboard `.env` and run (sentrix-dashboard)

```bash
cd ../sentrix-dashboard
cp .env.example .env
npm install
```

Set in `.env`:

```dotenv
VITE_API_URL=http://localhost/api/v1     # backend app is on port 80
VITE_DEVICE_NAME=Sentrix Console (web)

# Realtime — must match the backend REVERB_* from step 1
VITE_REVERB_APP_KEY=sentrix-local-key    # == backend REVERB_APP_KEY
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

```bash
npm run dev      # serves the dashboard on http://localhost:5173
```

Open http://localhost:5173 → you should be redirected to `/signin`.

## 5. CORS — what works now vs. what realtime needs

The dashboard (`:5173`) and API (`:80`) are different origins, so CORS applies.

- **Scenarios A–E (login, nav, incident list/detail, org context)** work out of the
  box: Laravel's default CORS allows `api/*` from any origin with any headers, which
  already covers `/api/v1/...` plus the `Authorization` and `X-Organization` headers.
- **Scenario F (realtime)** needs two backend additions (the flagged follow-ups):
  1. **Expose the Reverb port to the host.** `compose.yaml` doesn't forward 8080.
     Add a `compose.override.yml` in the backend root (additive, doesn't edit the
     original):
     ```yaml
     services:
       laravel.test:
         ports:
           - '8080:8080'
     ```
     then `sail up -d` again.
  2. **Register `/broadcasting/auth` for bearer + allow it in CORS.** In
     `bootstrap/app.php` add `->withBroadcasting(__DIR__.'/../routes/channels.php',
     ['middleware' => ['auth:sanctum']])`, and publish `config/cors.php`
     (`sail artisan config:publish cors`) adding `broadcasting/auth` to `paths` and
     pinning `allowed_origins` to `http://localhost:5173`.

> Until F's two items are done, the dashboard shows the realtime indicator as
> **Offline** and everything else still works (data refetches on focus). A–E are
> the gate; F is the realtime bonus.

## 6. Run the verification scenarios

With backend (steps 2) + dashboard (step 4) running, follow
`docs/VERIFICATION.md` §8 **A–E** now, and **F–G** after the two realtime items above.

Quick happy-path:
1. http://localhost:5173 → `/signin`.
2. Sign in `test@example.com` / `password`.
3. Sidebar → **Incidents** → see the seeded incidents; filter by status/severity
   (URL updates); click a row → detail with **summary + timeline + assignment**.
4. User menu → Sign out.

## 7. Stopping / resetting

```bash
# dashboard: Ctrl-C in its terminal
# backend:
sail down            # stop containers (keeps data)
sail down -v         # stop AND wipe DB/redis volumes (full reset)
```

## Troubleshooting

- **CORS error in console on login** — confirm `VITE_API_URL` is exactly
  `http://localhost/api/v1` and the backend is on port 80 (`sail ps`).
- **401 immediately after login** — clock/seed issue; re-run `migrate:fresh --seed`.
- **DB connection refused** — `DB_HOST` must be `pgsql` (service name), not localhost.
- **Realtime stays Offline** — expected until §5 F-items are done; check `queue:work`
  and `reverb:start` are both running and 8080 is forwarded.
- **Port 80 in use** — set `APP_PORT=8000` in backend `.env`, then
  `VITE_API_URL=http://localhost:8000/api/v1` in the dashboard.
