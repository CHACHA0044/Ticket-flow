# Ticket Flow — Frontend

Next.js 16 (App Router) frontend for the Ticket Flow real-time event booking system: seat
selection, 600-second holds, checkout, tickets, booking history, and an operations dashboard.

Runs fully standalone on an in-memory mock data layer, or against the Express/Socket.io backend
by setting environment variables.

## Requirements

- Node.js 20.9+ (built and verified on Node 20.x)
- npm 10+

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

No `.env.local` is required — with no configuration the app runs entirely on the mock data layer.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next 16 removed `next lint`) |
| `npm run typecheck` | `tsc --noEmit` |

## Environment variables

Copy `.env.example` to `.env.local` and set only what you need. Never commit `.env.local`.

| Variable | Default | Effect |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | *(empty)* | Backend REST base. Empty → in-memory mock layer |
| `NEXT_PUBLIC_SOCKET_URL` | *(empty)* | Socket.io origin. Empty → simulated realtime seat feed |
| `NEXT_PUBLIC_ENABLE_MOCK_REALTIME` | `true` in dev | Force-enable the simulator; auto-disabled when a real socket URL is set |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical + Open Graph origin |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *(placeholder)* | Test-mode key; checkout ships as a mock |

`NEXT_PUBLIC_*` values are inlined at build time — set them in Vercel, not at runtime.

## Connecting the real backend

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.example.com
```

Both are optional and independent. Setting only the API URL keeps the realtime simulator;
setting the socket URL always wins and disables the simulator so the two feeds cannot race.

## Demo accounts

Any password of **8 or more characters** is accepted by the mock auth layer.

| Role | Email |
| --- | --- |
| Customer | `pranav.dembla@integral.edu.in` |
| Admin | `ops.admin@ticketflow.dev` |

Admin sessions unlock `/admin` (KPIs, revenue, seat utilisation, health telemetry, ops tables).
Customer sessions hitting `/admin` are redirected to `/events`.

## Test payment card

`4242 4242 4242 4242`, any future expiry, any CVC. UPI and net-banking accept provider IDs
(`upi@tf`, `NETBANKING`) and are validated only when selected.

## Routes

| Route | Rendering | Access |
| --- | --- | --- |
| `/` | Server | Public |
| `/events`, `/events/[eventId]` | Server | Public |
| `/events/[eventId]/seats` | Client seat map | Public |
| `/checkout` | Client | Authenticated |
| `/booking/[bookingId]/success` | Server | Owner |
| `/bookings`, `/bookings/[bookingId]` | Server | Authenticated |
| `/profile` | Server | Authenticated |
| `/admin` | Server | Admin only |
| `/login`, `/register` | Server + client form | Public |
| `/how-it-works` | Server | Public |
| `/api/*` | Route handlers | Per-endpoint |

SEO: `/sitemap.xml` (public routes only), `/robots.txt` (disallows private routes),
`/manifest.webmanifest`, `/icon.svg`. Authenticated and transactional pages send
`robots: { index: false }`.

## Architecture notes

- `lib/api/server.ts` builds service objects for Server Components; `lib/api/client.ts` fetches
  same-origin `/api/*` from the browser. Both resolve to the same shape, so pages do not branch
  on transport.
- `app/api/*` implements the REST surface in-process so the app is deployable as a single unit.
  Swap the route handler bodies for proxied calls to the real backend when it exists.
- `realtime/` exposes a socket-backed provider and an in-browser simulator behind one interface.
- Sessions use an `HttpOnly` `tf_uid` cookie with `SameSite=lax`. `Secure` is set when
  `NODE_ENV === 'production'`, so **production must be served over HTTPS** (Vercel does this).
- Holds are 600 seconds with a single shared countdown driving the visible timer and payment
  state; expiry disables payment and prompts re-selection.

## Deployment (Vercel)

1. Import the repository and set the project root to `frontend`.
2. Framework preset: Next.js. Build `npm run build`, output the default `.next`.
3. Add the environment variables above for the production origin (`NEXT_PUBLIC_SITE_URL` must be
   the deployed HTTPS origin or canonical/OG URLs will be wrong).
4. No custom build settings or rewrite rules are required.

For any other host: run `npm run build && npm start` behind TLS, and keep `.next` on the same
volume between build and start.

## Known constraints

- Mock data lives in memory and resets on restart, so holds, bookings, and occupancy drift are
  per-instance. Do not rely on persistence for demos.
- Realtime holds and payments are simulated; there is no real payment gateway integration.
- `npm audit` reports 5 high-severity advisories in the `eslint-config-next` dev dependency
  chain. These are build-time only. `npm audit fix --force` would downgrade Next's ESLint preset
  and break the flat config — do not run it.
- The React Compiler skips compilation of the React Hook Form subtree (one warning in
  `components/checkout/payment-form.tsx`). It is dev-only and does not affect runtime behaviour.
