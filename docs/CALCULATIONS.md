# Calculations registry

Every number the app shows comes from one of these functions in `src/lib/time`. Change a rule here, in the
code, and in its test (`tests/time/*.test.ts`) together.

| Number | Function | Rule |
|---|---|---|
| Day length | `dayBounds` | From local midnight to the next local midnight in the settings time zone: 23, 24, 24.5 or 25 h. If midnight is skipped (clocks jump forward at 00:00), the day starts at the first instant that exists. |
| Week length | `weekSummary().lengthMs` | Sum of its 7 days: 167, 168 or 169 h. |
| Week | `weekDates` | 7 dates from the chosen first day (0 = Sunday … 6 = Saturday). |
| Time per activity or category | `daySummary().finalized` | Sum of finished records, clipped to the day. A record crossing midnight is split between the days. |
| Provisional time | `daySummary().provisional` | Running timer from its start to now, clipped to the day. Never in finalized totals. |
| Tracked | `trackedMs` | Union of all clipped records, including the running one, so overlaps are not counted twice. |
| Untracked | `untrackedMs` | Elapsed part of the day minus tracked. |
| Future | `futureMs` | Part of the day after now. Neither tracked nor untracked. |
| Reconciliation | (test) | tracked + untracked + future = day length. Category totals add up to finalized tracked when there is no overlap. |
| Gaps | `gaps` | Elapsed stretches with no record (used by the evening catch-up). |
| Overlaps | `overlaps` | Pairs of records that overlap, with the overlapping time. Shown as conflicts. |
| Average per calendar day | `perCalendarDay(total, days)` | Divides by every day counted, including days with zero. |
| Average per active day | `perActiveDay(total, activeDays)` | Divides by days on which it happened ("per commuting day"). |
| Recent daily average | `baseline` | Earlier **complete** days with at least 4 h recorded. The screen shows how many days it used. Under 3 days: no comparison. |
| Week over week | `weekOverWeek` | Complete week: totals. Week in progress: per-day average over complete days versus last week ÷ 7, marked "so far". |
| Heatmap | `heatmap` | Minutes per weekday × local hour, finished records only. |
| Find My Time signals | `findTimeSignals` | Only activities marked **adjustable**. *Large share*: ≥ 5 % of tracked and ≥ 3 h a week. *Small blocks*: ≥ 7 blocks, median ≤ 20 min, total ≥ 2 h. *Over preferred*: ≥ 3 times longer than 125 % of the default duration. *Priority gap*: a complete week under the target. *Recurring untracked*: an hour slot ≥ 45 min untracked in ≥ 3 complete weeks. These thresholds are product choices, not research findings. |
| Simulator | `simulate` | Weekly = minutes a day × days a week. **Annual estimate** = weekly × 52, assuming the same behaviour all year. Warns when the cut is larger than what was recorded. |
| Actual vs ideal | `actualVsIdeal` | Planned minutes per category from ideal blocks versus finalized recorded minutes. |
| Suggestions | `suggestions` | Last 28 days of the same kind (weekday or weekend). An activity that started on ≥ 3 of those days within ±30 min of its median start, and has not been logged today. Offered from the usual time until 3 h after. Never saved without confirmation. |
| Display rounding | `formatDuration` | Rounded to the nearest minute, only at display time. |
