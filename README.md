# CRI — Construction Risk Intelligence

**Know the risk before you price the job.**

Evidence-backed client, payment and project risk reports for UK contractors.
CRI helps contractors check payment, client, PM, QS and project risk before
accepting or pricing work.

> CRI is a professional construction risk intelligence platform. It is **not** a
> blacklist, a revenge platform, or a public shaming board. Reports indicate
> contractor-submitted risk patterns and moderated experiences — CRI does not
> make legal findings of wrongdoing.

---

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (custom risk-intelligence design system)
- **PostgreSQL** + **Prisma ORM**
- **Zod** for server-side validation
- **Server Actions** for form submission and moderation

---

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (tested on Node 22)
- A running PostgreSQL database

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file and set your database connection string:

```bash
cp .env.example .env
```

`.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cri?schema=public"
# Placeholder admin gate — replace before production (see lib/auth.ts)
ADMIN_PASSWORD="cri-admin-demo"
```

### 4. Set up the database

```bash
npx prisma migrate dev   # creates tables from prisma/schema.prisma
npm run db:seed          # loads fictional demo data
```

### 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build (type-checked) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:migrate` | Create/apply a migration |
| `npm run db:seed` | Seed fictional demo data |

---

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Marketing home (hero, what CRI tracks, example report, how it works) |
| `/search` | Search **approved** reports only (privacy-aware results) |
| `/submit-report` | Submit a report (validated, defaults to `PENDING`) |
| `/reports/[id]` | Public report (approved only; residential data restricted) |
| `/admin` | Moderation dashboard (placeholder password gate) |
| `/legal` | Legal & data protection |
| `/pricing` | Pricing (payments not implemented) |

### Admin access

Visit `/admin` and sign in with the value of `ADMIN_PASSWORD`
(default `cri-admin-demo`). From there you can approve / reject / dispute
reports, set evidence status and visibility, and edit the public summary.

---

## Architecture

```
app/            # Routes, pages, server actions
components/      # Reusable UI (badges, cards, forms, sections)
lib/
  db.ts         # Prisma client singleton
  reports.ts    # Data-access helpers (public + admin)
  privacy.ts    # PUBLIC/PRIVATE boundary — toPublicReport()
  validation.ts # Zod schemas (server-side source of truth)
  constants.ts  # Enum label maps + form options
  format.ts     # Display helpers
  auth.ts       # Admin gate (MVP stub)
prisma/
  schema.prisma # Models + enums
  seed.ts       # Fictional demo data
```

### Privacy model (important)

Public pages **only** ever receive a `PublicReport` produced by
`lib/privacy.ts → toPublicReport()`. That single function strips every private
field (reporter contact details, full residential name, exact address/postcode,
free-text issue description). If a field isn't on `PublicReport`, it cannot leak
to the client.

- Public search & report pages show **APPROVED** reports only.
- `ADMIN_ONLY` reports never appear in public search.
- Residential records show **initials + area** only (e.g. _Residential Client —
  C.A. — SW19_).
- New reports always default to `PENDING` moderation (enforced in
  `createRiskReport`).

---

## What is **not** implemented (MVP scope)

- **Payments / Stripe** — pricing is display-only ("Payments coming soon").
- **Real authentication** — `/admin` uses a single shared-password stub
  (`lib/auth.ts`). Replace with a real provider (Auth.js/Clerk/etc.) and
  per-user `ADMIN` roles before production. Verified-contractor accounts and the
  gated "deeper reports" tier are not built yet.
- **File uploads** — the evidence model exists and the UI shows an "Evidence
  upload coming soon" placeholder; only text-based evidence is stored for now.
- **Email / notifications** — risk alerts are not sent.
- ESLint does not block `next build` (see `next.config.mjs`); run `npm run lint`
  separately. TypeScript type-checking **is** enforced during build.

## Remaining risks / notes

- This is a demonstration MVP. **No claim of legal or regulatory compliance is
  made.** The legal page and disclaimers are templates and must be reviewed by a
  qualified professional before any real use.
- The admin gate is a placeholder and is not suitable for production.
- All seed data is **fictional** and for demonstration only.
