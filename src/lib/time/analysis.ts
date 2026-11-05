// Comparisons, heatmap, "Find My Time" signals, the time-recovery simulator,
// actual-vs-ideal and smart suggestions. All pure functions over records or summaries.
// Every result says how much data it rests on, so screens can say "not enough data yet".

import { clip, type Interval } from './intervals.ts';
import { categoryOf, ranked, type DaySummary, type WeekSummary } from './summary.ts';
import {
  addDays,
  dayBounds,
  localDateOf,
  localMinuteOfDay,
  localToInstant,
  MINUTE,
  wallClock,
  weekdayOf,
  type LocalDate,
} from './tz.ts';
import type { Library, PlannedBlock, TimeRecord } from './types.ts';

// ---------- Comparisons ----------

export type Baseline = { avgMs: number; days: number };

/**
 * Average daily time for a key (category or activity) over earlier days.
 * Only complete days with at least `minTrackedMs` recorded count, because a day
 * with almost nothing logged says nothing about how the time was spent.
 */
export function baseline(
  earlierDays: DaySummary[],
  key: string,
  by: 'category' | 'activity',
  minTrackedMs = 4 * 60 * MINUTE,
): Baseline {
  const usable = earlierDays.filter((d) => d.complete && d.finalized.trackedMs >= minTrackedMs);
  if (usable.length === 0) return { avgMs: 0, days: 0 };
  const map = (d: DaySummary) => (by === 'category' ? d.finalized.byCategory : d.finalized.byActivity);
  const total = usable.reduce((s, d) => s + (map(d).get(key) ?? 0), 0);
  return { avgMs: total / usable.length, days: usable.length };
}

export type Delta = { id: string; currentMs: number; previousMs: number; deltaMs: number };

/**
 * Week over week, per category. When the current week is still in progress the
 * comparison is on the average per elapsed complete day, and `partial` is true.
 */
export function weekOverWeek(
  current: WeekSummary,
  previous: WeekSummary,
): { partial: boolean; daysCompared: number; deltas: Delta[] } {
  const partial = current.completeDays < 7;
  const days = partial ? current.completeDays : 7;
  const keys = new Set([...current.finalized.byCategory.keys(), ...previous.finalized.byCategory.keys()]);
  const deltas: Delta[] = [];
  if (days === 0) return { partial, daysCompared: 0, deltas };
  for (const id of keys) {
    const cur = partial
      ? current.days.filter((d) => d.complete).reduce((s, d) => s + (d.finalized.byCategory.get(id) ?? 0), 0) / days
      : current.finalized.byCategory.get(id) ?? 0;
    const prev = partial
      ? (previous.finalized.byCategory.get(id) ?? 0) / 7
      : previous.finalized.byCategory.get(id) ?? 0;
    deltas.push({ id, currentMs: cur, previousMs: prev, deltaMs: cur - prev });
  }
  deltas.sort((a, b) => Math.abs(b.deltaMs) - Math.abs(a.deltaMs) || a.id.localeCompare(b.id));
  return { partial, daysCompared: days, deltas };
}

// ---------- Heatmap ----------

/**
 * Minutes per weekday (0 = Sunday) × local hour (0-23), for records between two dates
 * inclusive. `filter` picks the activities or categories to include.
 */
export function heatmap(
  records: TimeRecord[],
  lib: Library,
  from: LocalDate,
  to: LocalDate,
  timeZone: string,
  filter: (activityId: string, categoryId: string) => boolean = () => true,
): number[][] {
  const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const range = { start: dayBounds(from, timeZone).start, end: dayBounds(to, timeZone).end };
  for (const r of records) {
    if (r.end === null) continue;
    if (!filter(r.activityId, categoryOf(lib, r.activityId))) continue;
    const c = clip({ start: r.start, end: r.end }, range);
    if (!c) continue;
    let t = c.start;
    while (t < c.end) {
      const w = wallClock(t, timeZone);
      const toNextHour = ((60 - w.minute) * 60 - w.second) * 1000 - (t % 1000);
      const next = Math.min(c.end, t + toNextHour);
      grid[weekdayOf(localDateOf(t, timeZone))][w.hour] += (next - t) / MINUTE;
      t = next;
    }
  }
  return grid;
}

// ---------- Find My Time ----------

export type TimeSignal =
  | { kind: 'large-share'; activityId: string; weeklyMs: number; share: number }
  | { kind: 'small-blocks-add-up'; activityId: string; count: number; medianMs: number; totalMs: number }
  | { kind: 'over-preferred'; activityId: string; preferredMs: number; times: number; extraMs: number }
  | { kind: 'priority-gap'; categoryId: string; targetMs: number; recordedMs: number }
  | { kind: 'recurring-untracked'; weekday: number; hour: number; weeks: number };

/**
 * Observations for "Find My Time". They describe patterns; they never label time
 * as waste. Only activities the person marked as adjustable are ever offered as
 * things to reduce (`large-share`, `small-blocks-add-up`, `over-preferred`).
 */
export function findTimeSignals(input: {
  week: WeekSummary;
  records: TimeRecord[]; // finished records in the week
  lib: Library;
  priorities: Array<{ categoryId: string; targetMsPerWeek: number }>;
  earlierWeeks?: WeekSummary[]; // for recurring untracked periods
  timeZone: string;
}): TimeSignal[] {
  const { week, records, lib, priorities, timeZone } = input;
  const signals: TimeSignal[] = [];
  const adjustable = (id: string) => lib.activities.get(id)?.adjustable === true;
  const tracked = week.finalized.trackedMs;

  for (const { id, ms } of ranked(week.finalized.byActivity)) {
    if (!adjustable(id) || tracked === 0) continue;
    const share = ms / tracked;
    if (share >= 0.05 && ms >= 3 * 60 * MINUTE) {
      signals.push({ kind: 'large-share', activityId: id, weeklyMs: ms, share });
    }
  }

  const finished = records.filter((r): r is TimeRecord & { end: number } => r.end !== null);
  const byActivity = new Map<string, number[]>();
  for (const r of finished) {
    const list = byActivity.get(r.activityId) ?? [];
    list.push(r.end - r.start);
    byActivity.set(r.activityId, list);
  }
  for (const [id, durations] of byActivity) {
    if (!adjustable(id)) continue;
    const sorted = [...durations].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const total = durations.reduce((s, d) => s + d, 0);
    if (durations.length >= 7 && median <= 20 * MINUTE && total >= 2 * 60 * MINUTE) {
      signals.push({ kind: 'small-blocks-add-up', activityId: id, count: durations.length, medianMs: median, totalMs: total });
    }
    const preferred = lib.activities.get(id)?.defaultDurationMin;
    if (preferred) {
      const over = durations.filter((d) => d > preferred * MINUTE * 1.25);
      const extra = over.reduce((s, d) => s + d - preferred * MINUTE, 0);
      if (over.length >= 3) {
        signals.push({ kind: 'over-preferred', activityId: id, preferredMs: preferred * MINUTE, times: over.length, extraMs: extra });
      }
    }
  }

  for (const p of priorities) {
    const recorded = week.finalized.byCategory.get(p.categoryId) ?? 0;
    if (week.completeDays === 7 && p.targetMsPerWeek > 0 && recorded < p.targetMsPerWeek) {
      signals.push({ kind: 'priority-gap', categoryId: p.categoryId, targetMs: p.targetMsPerWeek, recordedMs: recorded });
    }
  }

  // An hour slot that is mostly untracked in at least 3 of the complete weeks.
  const weeks = [...(input.earlierWeeks ?? []), week].filter((w) => w.completeDays === 7);
  if (weeks.length >= 3) {
    const counts = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    for (const w of weeks) {
      for (const d of w.days) {
        const perHour = new Array<number>(24).fill(0);
        for (const g of d.gaps) {
          let t = g.start;
          while (t < g.end) {
            const wc = wallClock(t, timeZone);
            const next = Math.min(g.end, t + ((60 - wc.minute) * 60 - wc.second) * 1000 - (t % 1000));
            perHour[wc.hour] += next - t;
            t = next;
          }
        }
        perHour.forEach((ms, h) => {
          if (ms >= 45 * MINUTE) counts[weekdayOf(d.date)][h]++;
        });
      }
    }
    for (let wd = 0; wd < 7; wd++) {
      for (let h = 0; h < 24; h++) {
        if (counts[wd][h] >= 3) signals.push({ kind: 'recurring-untracked', weekday: wd, hour: h, weeks: counts[wd][h] });
      }
    }
  }
  return signals;
}

// ---------- Time-recovery simulator ----------

export type Adjustment = {
  label: string;
  minutesPerDay: number; // reduction
  daysPerWeek: number;
  recordedWeeklyMs?: number; // what the records show, for a reality check
};

export type Simulation = {
  rows: Array<Adjustment & { weeklyMin: number; exceedsRecorded: boolean }>;
  weeklyMin: number;
  /** Estimate: weekly × 52, assuming the same behaviour all year. */
  annualEstimateMin: number;
  allocations: Array<{ priority: string; weeklyMin: number }>;
  unallocatedWeeklyMin: number;
};

export function simulate(
  adjustments: Adjustment[],
  allocate: Array<{ priority: string; weeklyMin: number }> = [],
): Simulation {
  const rows = adjustments.map((a) => {
    const minutes = clamp(Math.round(a.minutesPerDay), 0, 1440);
    const days = clamp(Math.round(a.daysPerWeek), 0, 7);
    const weeklyMin = minutes * days;
    const exceedsRecorded = a.recordedWeeklyMs !== undefined && weeklyMin * MINUTE > a.recordedWeeklyMs;
    return { ...a, minutesPerDay: minutes, daysPerWeek: days, weeklyMin, exceedsRecorded };
  });
  const weeklyMin = rows.reduce((s, r) => s + r.weeklyMin, 0);
  let left = weeklyMin;
  const allocations = allocate.map((a) => {
    const take = clamp(Math.round(a.weeklyMin), 0, left);
    left -= take;
    return { priority: a.priority, weeklyMin: take };
  });
  return { rows, weeklyMin, annualEstimateMin: weeklyMin * 52, allocations, unallocatedWeeklyMin: left };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));
}

// ---------- Actual vs ideal ----------

export function plannedTotals(blocks: PlannedBlock[], lib: Library): Map<string, number> {
  const out = new Map<string, number>();
  for (const b of blocks) {
    const cat = b.categoryId ?? (b.activityId ? categoryOf(lib, b.activityId) : null);
    if (!cat) continue;
    out.set(cat, (out.get(cat) ?? 0) + b.durationMin * MINUTE);
  }
  return out;
}

export function actualVsIdeal(
  week: WeekSummary,
  blocks: PlannedBlock[],
  lib: Library,
): Array<{ categoryId: string; plannedMs: number; recordedMs: number; differenceMs: number }> {
  const planned = plannedTotals(blocks, lib);
  const keys = new Set([...planned.keys(), ...week.finalized.byCategory.keys()]);
  return [...keys]
    .map((categoryId) => {
      const plannedMs = planned.get(categoryId) ?? 0;
      const recordedMs = week.finalized.byCategory.get(categoryId) ?? 0;
      return { categoryId, plannedMs, recordedMs, differenceMs: recordedMs - plannedMs };
    })
    .sort((a, b) => b.plannedMs - a.plannedMs || b.recordedMs - a.recordedMs);
}

/** Ideal blocks laid onto real dates (for the side-by-side calendar). */
export function expandPlanned(
  blocks: PlannedBlock[],
  dates: LocalDate[],
  timeZone: string,
): Array<PlannedBlock & Interval & { date: LocalDate }> {
  const out: Array<PlannedBlock & Interval & { date: LocalDate }> = [];
  for (const date of dates) {
    const wd = weekdayOf(date);
    for (const b of blocks) {
      if (b.weekday !== wd) continue;
      const start = localToInstant(date, b.startMinute, timeZone);
      const end = localToInstant(date, b.startMinute + b.durationMin, timeZone);
      out.push({ ...b, date, start, end });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

// ---------- Smart suggestions ----------

export type Suggestion = {
  activityId: string;
  usualStartMinute: number;
  usualDurationMin: number;
  occurrences: number;
  daysLookedAt: number;
};

/**
 * "You usually commute around 7:15." Looks at the last `lookbackDays` days of the same
 * kind (weekday or weekend) as `date`. An activity qualifies when it started on at least
 * 3 of those days, within ±30 minutes of its median start, and it has not been
 * recorded on `date` yet. Suggestions are proposals only; nothing is saved.
 */
export function suggestions(
  records: TimeRecord[],
  date: LocalDate,
  timeZone: string,
  now: number,
  lookbackDays = 28,
): Suggestion[] {
  const isWeekend = (d: LocalDate) => [0, 6].includes(weekdayOf(d));
  const kind = isWeekend(date);
  const from = dayBounds(addDays(date, -lookbackDays), timeZone).start;
  const today = dayBounds(date, timeZone);
  const daysLookedAt = Array.from({ length: lookbackDays }, (_, i) => addDays(date, -lookbackDays + i)).filter(
    (d) => isWeekend(d) === kind,
  ).length;

  const starts = new Map<string, Array<{ minute: number; durationMin: number; day: LocalDate }>>();
  const doneToday = new Set<string>();
  for (const r of records) {
    if (r.start >= today.start && r.start < today.end) doneToday.add(r.activityId);
    if (r.end === null || r.start < from || r.start >= today.start) continue;
    const day = localDateOf(r.start, timeZone);
    if (isWeekend(day) !== kind) continue;
    const list = starts.get(r.activityId) ?? [];
    list.push({ minute: localMinuteOfDay(r.start, timeZone), durationMin: (r.end - r.start) / MINUTE, day });
    starts.set(r.activityId, list);
  }

  const nowMinute = now >= today.start && now < today.end ? localMinuteOfDay(now, timeZone) : null;
  const out: Suggestion[] = [];
  for (const [activityId, list] of starts) {
    if (doneToday.has(activityId)) continue;
    const median = medianOf(list.map((x) => x.minute));
    const near = list.filter((x) => Math.abs(x.minute - median) <= 30);
    const days = new Set(near.map((x) => x.day)).size;
    if (days < 3) continue;
    // Offer it from its usual time until three hours later.
    if (nowMinute !== null && (nowMinute < median || nowMinute > median + 180)) continue;
    out.push({
      activityId,
      usualStartMinute: Math.round(median),
      usualDurationMin: Math.round(medianOf(near.map((x) => x.durationMin))),
      occurrences: days,
      daysLookedAt,
    });
  }
  return out.sort((a, b) => a.usualStartMinute - b.usualStartMinute);
}

function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
