# HackathonHub

A modern hackathon aggregator that automatically discovers and displays open & upcoming hackathons from across the web — with a strong focus on Indian hackathons. Built with Next.js, Supabase, and GitHub Actions.

**Live:** https://hackathon-hub-ten.vercel.app

---

## What it does

HackathonHub scrapes 6 major hackathon platforms every day at 11:30 AM IST via GitHub Actions, stores everything in Supabase, and serves it through a fast, filterable UI. No manual curation needed — the database refreshes itself daily.

### Sources scraped

| Platform | Limit | Best for |
|---|---|---|
| Unstop | 300 | Indian hackathons (primary) |
| Devfolio | ~200 | Indian college hackathons |
| HackerEarth | 80 | Indian developer competitions |
| Devpost | ~100 | Global / US hackathons |
| DoraHacks | 50 | Web3 / blockchain hackathons |
| MLH | ~50 | Global student hackathons |

**Total: up to ~780 hackathons per daily scrape.**

---

## Features

- **Auto-scraping** — GitHub Actions cron job runs daily, scrapes all platforms, upserts into Supabase. Existing hackathons are updated (deadline, participant count, prize); new ones are inserted.
- **Filters** — mode (Online / In-Person / Hybrid), deadline (≤3 days, this week, this month), tag-based filtering
- **Tag search** — click any tag on a card to filter by it instantly
- **Text search** — debounced search across hackathon titles
- **Sort** — by newest, deadline, or most participants
- **Deadline display** — cards show "2 days left" style countdown with color-coded urgency (red for ≤3 days, amber for ≤7, grey beyond)
- **Location display** — offline/hybrid hackathons show city/country on the card
- **Placeholder images** — themed fallback images (AI, WEB3, GAME, HEALTH, etc.) when a hackathon has no banner
- **Load More** — append-based loading with progress indicator instead of numbered pagination
- **Google OAuth** — sign in with Google via NextAuth.js

---

## Tech stack

- **Framework:** Next.js (App Router, TypeScript, Turbopack)
- **Database:** Supabase (PostgreSQL with RLS)
- **Auth:** NextAuth.js with Google OAuth provider
- **Styling:** Tailwind CSS v4, Framer Motion, glass morphism
- **Scraping:** Axios-based scrapers per platform, run via GitHub Actions
- **Deployment:** Vercel (frontend + API routes), Supabase (database)

---

## Project structure

```
hackathon-hub/
├── app/
│   ├── page.tsx              # Main listing page (filters, search, load more)
│   ├── api/
│   │   ├── hackathons/       # GET endpoint — filtering, sorting, pagination
│   │   └── admin/scrape/     # POST endpoint — triggers all scrapers
├── components/
│   ├── HackathonCard.tsx     # Card with deadline pill, location, tags, placeholder image
│   └── FilterBar.tsx         # Mode, deadline, and sort filters
├── lib/
│   ├── supabase.ts           # Client + admin Supabase setup
│   └── scrapers/
│       ├── devpost.ts
│       ├── devfolio.ts
│       ├── dorahacks.ts
│       ├── hackerearth.ts
│       ├── unstop.ts
│       └── mlh.ts
├── types/
│   └── index.ts              # Shared TypeScript types
└── .github/
    └── workflows/
        └── scrape.yml        # Daily cron job at 6:00 AM UTC (11:30 AM IST)
```

---

## Running locally

### Prerequisites

- Node.js 18+
- A Supabase project
- Google OAuth credentials (for sign-in)

### 1. Clone and install

```bash
git clone https://github.com/yaswanthme007/Hackathon-Hub.git
cd hackathon-hub
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

SCRAPE_SECRET=your_scrape_secret
```

### 3. Supabase table

Run this in your Supabase SQL editor:

```sql
create table hackathons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  source text,
  source_url text unique,
  organizer text,
  prize_amount text,
  tags text[] default '{}',
  mode text default 'online',
  location text,
  participants_count integer default 0,
  registration_deadline timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Trigger a manual scrape

```bash
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Content-Type: application/json" \
  -d '{"secret":"your_scrape_secret"}'
```

---

## Automated scraping (GitHub Actions)

The workflow at `.github/workflows/scrape.yml` runs daily at **6:00 AM UTC (11:30 AM IST)**. It calls the `/api/admin/scrape` endpoint on the deployed Vercel URL.

Required GitHub secrets:

| Secret | Value |
|---|---|
| `APP_URL` | `https://hackathon-hub-ten.vercel.app` |
| `SCRAPE_SECRET` | Your scrape secret |

Each scrape upserts by `source_url` — existing hackathons are refreshed, new ones are added, nothing is deleted automatically.

---

## How the In-Person filter works

Indian college hackathons are typically listed as `hybrid` (they have both online and in-person tracks). The In-Person filter includes both `offline` and `hybrid` modes so these hackathons are visible when you filter by In-Person.

---

## License

MIT
