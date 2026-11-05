# Your Perfect Week

Personal time-tracking and weekly-planning web app. Separate product from TLA: own repo, own Supabase project.

## Rules

- Every number comes from `src/lib/time` (registry: `docs/CALCULATIONS.md`). Never compute a total inside a
  component. Change a rule → change the code, its test and the registry together.
- Measured, compared and hypothetical are labelled differently on screen. Untracked is never "wasted".
  Estimates (annual projections) say they are estimates.
- Only activities the person marked `adjustable` are offered as things to reduce.
- Suggestions, routines and recurring plans produce drafts; nothing becomes a record without a tap.
- Every table has RLS `user_id = auth.uid()`. Never disable it. Service-role key never in the client or repo.
- Sample data only under `/demo`, clearly labelled, never mixed with a person's analytics.
- Work on a branch and open a pull request; don't push to `main`.

## Checks

`npm test` (engine) · `npm run test:db` (schema + RLS on local Postgres) · CI runs both on every PR.
