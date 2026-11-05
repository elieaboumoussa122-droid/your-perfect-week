# Your Perfect Week — architecture

*See where your time goes. Take back control.*

This document is the plan the code follows. Section 9 lists what is built and what is not.

## 1. Principles

1. **Records are the truth.** Every number on every screen is computed from saved records by one shared
   engine (`src/lib/time`). No screen has its own version of a total.
2. **Measured, estimated and interpreted are kept apart.** "You recorded 1 h 20 min of social media" is
   measured. "That's 40 min more than your recent average" is a comparison. "Reducing it by 20 min a day could
   free 2 h 20 min a week" is a hypothetical. The interface labels each one.
3. **Unknown is not wasted.** Untracked time is shown as grey and called "untracked", never "wasted". The app
   never fills a gap by itself.
4. **The person decides what is adjustable.** Sleep, care, childcare, recovery and medical time are never
   offered as things to cut unless the person marks them as adjustable.
5. **Nothing is saved without a tap.** Suggestions, routines and recurring plans create drafts. A draft becomes
   a record only when the person confirms it.
6. **Plans are not records.** A Perfect Week and recurring plans live in their own tables, on the wall clock.
   Recorded activities are always in the past.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript | Server-rendered shell, client islands for the calendar; one codebase for web and a later PWA. |
| Style | Tailwind CSS + accessible primitives (Radix, the base of shadcn/ui) | Fast, consistent, and keyboard and screen-reader support built in. |
| Motion | Motion (Framer Motion) | Small transitions only; respects `prefers-reduced-motion`. |
| Charts | Recharts for bars and donuts; custom SVG for timelines and the 168-hour grid | The timeline is the product, so it is hand-built for exact control of drag, resize and touch. |
| Data | Supabase: Postgres, Auth, row-level security | Strict per-user isolation in the database itself. |
| Time | Own engine on the platform `Intl` time-zone database | No dependency. Handles daylight saving (23 h, 25 h and 24.5 h days) and clocks that change at midnight. |
| Tests | `node --test` (engine), plain Postgres (schema and security), Playwright (journeys) | All of them run in CI without Docker. |

## 3. Navigation

| Phone (bottom bar) | Desktop (sidebar) | What it answers |
|---|---|---|
| **Today** | Today | How is my day going? Live timer, today's timeline, untracked gaps, top three. |
| **Calendar** | Calendar | Day, week and month views; drag, resize, add, edit. |
| **Insights** | Insights | *How did I spend my day?* · *My week in review* · *Find my time* |
| **Perfect Week** | My Perfect Week | Design the ideal week; actual versus ideal. |
| **Profile** | Profile | Activity library, routines, reminders, time zone, week start, 12/24 h, theme, export and delete. |

The **Start activity** button is always one tap away: a floating button on phones and a header control on desktop.
While a timer runs it becomes **Switch** and **Finish**.

### Routes

```
/                       → Today (redirects to /welcome on first visit)
/welcome                → onboarding (5 steps, all skippable)
/calendar/day/[date]    /calendar/week/[date]    /calendar/month/[date]
/insights/day/[date]    /insights/week/[date]    /insights/find-time
/perfect-week           /perfect-week/compare/[date]
/profile                /profile/library   /profile/routines   /profile/reminders   /profile/data
/demo                   → clearly labelled sample data, kept apart from real data
/auth/sign-in           /auth/callback
```

## 4. Data model

Schema: `supabase/migrations/20261105000000_init.sql`. Every table has `user_id`, row-level security
(`user_id = auth.uid()`), and no access for anonymous visitors.

| Table | Holds | Key rules |
|---|---|---|
| `user_settings` | time zone, week start, 12/24 h, theme, timeline zoom, onboarding done | Created by the sign-up trigger; the client can only update it. |
| `notification_preferences` | reminders on or off, day and week review times, untracked nudges, quiet hours | Off by default. |
| `categories` | name, colour, icon, order | Name unique per person (ignoring case). Cannot be deleted while activities use it. |
| `activities` | name, category, colour override, icon, default duration, description, importance 1–5, class (essential, flexible, discretionary, recovery), **adjustable**, archived | Cannot be deleted while it has history; it is archived instead. |
| `activity_records` | activity, `start_at`, `end_at` (null = running), time zone, source, external source and id, notes | **No overlaps per person** (exclusion constraint); one running timer; never in the future; at most 72 h; `(external_source, external_id)` unique for future imports. |
| `recurring_activities` | activity, weekdays, start minute, duration, from and until dates, every N weeks | Plans, not records. |
| `routines`, `routine_items` | e.g. "Morning routine": activities at offsets | Applied to a day as drafts. |
| `ideal_weeks`, `ideal_blocks` | the Perfect Week: weekday, start minute, duration, activity or category | One active ideal week per person. |
| `priorities` | "more time for…": label, linked category, weekly target | |
| `daily_reflections` | how the day felt (1–5), three yes/no questions, a note | One per local date. Optional. |
| `recovery_scenarios` | saved simulator settings and the date the person started trying them | Supports "time actually reclaimed" (Phase 2). |

**Category of a record.** A record points to an activity, and its category is the activity's *current*
category. Moving "Instagram" from *Screen time* to *Work* therefore moves its history too, so totals stay
consistent everywhere. This replaces the brief's separate `category_id` on each record: two sources of truth
for the same fact would drift apart.

**Duration** is always derived (`end_at − start_at`), never stored, so it cannot disagree with the timestamps.

**Server functions.**
- `start_activity(activity)`: ends the running timer and starts the next one at the database clock, in one
  transaction. Switching within one minute of starting replaces the mistaken timer.
- `stop_activity()`.
- `delete_my_data()`: erases all of the person's rows.

Deleting the account itself (the sign-in) needs the service role, so it will be a small server function
(`supabase/functions/delete-account`). That is not built yet.

**Future integrations.** Imported blocks (screen time, calendars, wearables) arrive as ordinary
`activity_records` with `source = 'import'` and an `(external_source, external_id)` pair, which makes
re-importing idempotent. Activities and categories stay the person's own. Nothing in the model has to change.

## 5. Time rules (engine: `src/lib/time`, registry: `docs/CALCULATIONS.md`)

- Instants are UTC milliseconds. Days are local dates in the person's **settings** time zone. Each record also
  keeps the zone it was made in.
- A day is `[local midnight, next local midnight)`, so it can last 23, 24, 24.5 or 25 hours. A week is seven of
  those days from the chosen first day, so 167, 168 or 169 hours.
- A record crossing midnight contributes to each day only the part inside it.
- A running timer counts as **provisional** time. It is shown, but it is never part of finalized totals.
- Untracked = elapsed time minus tracked time. Time after "now" is *future*, not untracked.
- Tracked time is a union, so an overlap that slipped in (for example, from an import) is never counted twice.
  It is reported as a conflict.
- Averages say what they divide by: *per calendar day* (zero days included) or *per active day*
  ("per commuting day").
- Comparisons need enough data: at least 3 complete days with at least 4 h recorded. A week that is still in
  progress is compared on per-day averages and marked "so far".

## 6. Components

```
src/
  lib/time/          engine: tz, intervals, summary, analysis, plan, format   (pure, tested)
  lib/data/          Supabase client, typed queries, mutations, optimistic cache
  lib/defaults.ts    default categories, activities and colours for onboarding
  components/
    timeline/        DayTimeline, WeekGrid, MonthGrid, Block (drag, resize), NowLine, GapBlock
    tracking/        StartButton, ActivityPicker, RunningTimer, QuickAdd, RetroLogger, SuggestionChip
    charts/          Donut, RankedBars, StackedDays, Heatmap, TrackedRing, Week168
    insights/        FactList (measured), ObservationList (comparisons), SimulatorPanel
    perfect-week/    IdealEditor, CompareView
    library/         CategoryEditor, ActivityEditor, ColorPicker, RoutineEditor
    ui/              buttons, sheets, dialogs, toasts (accessible primitives)
  app/               routes listed above
```

**Calendar interaction.** Blocks use pointer events: press and drag to move; drag the top or bottom handle to
resize, snapping to 5 minutes, or 1 minute with Alt. A long press opens the menu (duplicate, copy to day,
delete). Tapping an empty slot opens quick add. On keyboard, arrow keys move a focused block by 5 minutes,
Shift+arrow resizes it, Enter edits and Delete deletes (with confirmation). Overlaps are not saved silently:
`planMakeRoom` proposes trim, split or delete and the person chooses.

## 7. Core journeys

1. **First visit**: *Your week has 168 hours* → priorities → activity library → typical routines (optional) →
   **Start your first day**. Every step can be skipped. The sample day lives under `/demo` only.
2. **Live tracking**: Start activity → pick "Driving" → arrive → tap **Work**. The drive ends and work begins
   (one tap, server clock).
3. **Evening catch-up**: *You have 3 untracked periods today* → "From 5:00 PM to 6:30 PM, what were you
   doing?" → pick → next gap.
4. **Day review**: *How did I spend my day?* → facts (measured), then optional comparisons, a donut, ranked
   bars and the timeline.
5. **Week review**: the 168-hour grid, seven stacked days, distribution, daily averages, week over week and a
   heatmap.
6. **Find my time**: signals (only on adjustable activities) → simulator → "could free 2 h 20 min a week for
   exercise (estimate)".
7. **Perfect Week**: draw the ideal week → compare it with the actual one, side by side.

## 8. Privacy

Only the person can see their data, which is enforced by the database and not only by the app. There are no
analytics trackers and no selling of data. Export means downloading everything as JSON or CSV. Delete covers
single records, all data (`delete_my_data`) or the whole account (server function, to do). Reflections are
never interpreted as stress, happiness or health. Device integrations will each ask for their own consent and
can be revoked.

### Phone screen time (Phase 4, research notes, not built)

- **Web browsers cannot read screen time.** No web API exposes it.
- **iOS**: the Screen Time API (FamilyControls, DeviceActivity, ManagedSettings) requires a native app with the
  Family Controls entitlement, granted by Apple. Per-app usage can be shown to the person through a
  DeviceActivityReport extension, but Apple's privacy design keeps that data on the device: the extension
  cannot send it to a server. So a native TLA-style "sync" of exact per-app minutes is not possible as
  designed. Confirm against Apple's current documentation before building.
- **Android**: `UsageStatsManager` gives per-app foreground time after the person grants Usage Access in
  system settings. Google Play policy restricts apps that request it. A native app (or a Capacitor/React Native
  wrapper) could import daily per-app totals as `source = 'import'` records.
- **Until then**, people log screen-time activities by hand (for example, "Instagram" under *Screen time*).

## 9. Status

| Area | Status |
|---|---|
| Time engine: zones, daylight saving, midnight split, day and week summaries, gaps, overlaps, comparisons, heatmap, Find My Time signals, simulator, actual vs ideal, suggestions, recurrence, routines, formatting | **Built and tested** (`npm test`) |
| Database schema, row-level security, live-timer functions, erase my data | **Built and tested** on local Postgres (`npm run test:db`) |
| Next.js app, design system, screens | **Not started.** The session's network blocked the npm registry. Next step. |
| Delete-account server function, reminders delivery, export | Planned for Phase 1 |
| Phases 2–4 | Engine support exists for Phase 2 and 3 calculations; screens to come |
