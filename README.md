# Your Perfect Week

**See where your time goes. Take back control.**

A personal time analyst. It turns your day into a colour-coded calendar, shows exactly where your 168 hours
go, helps you find realistic room for what matters, and lets you design the week you actually want.

> Status: foundation stage. The time-calculation engine and the database (with per-user security) are built
> and tested. The web app is next. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §9.

## What's here

| Path | What |
|---|---|
| `docs/ARCHITECTURE.md` | Product architecture: navigation, data model, components, journeys, privacy, status |
| `docs/CALCULATIONS.md` | Every number the app shows and the exact rule behind it |
| `src/lib/time/` | The shared time engine (time zones, daylight saving, day/week totals, insights, simulator) |
| `src/lib/defaults.ts` | The starter activity library offered at onboarding |
| `supabase/migrations/` | Database schema, row-level security, live-timer functions |
| `supabase/tests/` | Schema and security tests |
| `tests/time/` | Engine tests |

## Run the tests

Needs Node 22.18 or newer (it runs TypeScript directly) and, for the database tests, the PostgreSQL 15+
server binaries (`initdb`, `pg_ctl`, `psql`). No Docker or Supabase account needed.

```bash
npm test          # time engine
npm run test:db   # schema + row-level security on a throwaway local Postgres
```

## Set up Supabase (when the app lands)

1. Create a Supabase project for this app (separate from any other app).
2. Apply `supabase/migrations/*.sql` (Supabase CLI: `supabase link` then `supabase db push`, or paste into the
   SQL editor).
3. Auth → enable Email (magic link) and optionally Google.
4. Put the project URL and the **anon** (public) key in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role key never goes in the app or the repo.

Deployment instructions will be added with the app.
