// Daily and weekly summaries. Every screen that shows a total uses these functions,
// so the calendar, the day review, the week review and the simulator cannot disagree.
//
// Rules (see docs/CALCULATIONS.md):
// - Totals are computed from records, in milliseconds; screens round only for display.
// - A record that crosses midnight contributes to each day only the part inside it.
// - A running timer counts as provisional time, shown separately, never in finalized totals.
// - Untracked time is elapsed time with no record. Time later than "now" is future, not untracked.
// - Tracked time is the union of records, so an accidental overlap is never counted twice;
//   overlaps are reported so the person can fix them.

import { clip, findOverlaps, gaps, totalLength, type Interval } from './intervals.ts';
import { dayBounds, weekDates, type LocalDate } from './tz.ts';
import type { Library, TimeRecord } from './types.ts';

export const UNKNOWN_CATEGORY = '__unknown';

export type Segment = {
  recordId: string;
  activityId: string;
  categoryId: string;
  start: number;
  end: number;
  provisional: boolean; // running timer, end not known yet
  continuesBefore: boolean; // started on an earlier day
  continuesAfter: boolean; // ends on a later day
};

export type Totals = {
  byCategory: Map<string, number>;
  byActivity: Map<string, number>;
  trackedMs: number; // union, never double counted
};

export type DaySummary = {
  date: LocalDate;
  start: number;
  end: number;
  lengthMs: number; // 23, 24 or 25 h (daylight saving)
  elapsedMs: number; // part of the day that has already happened
  futureMs: number;
  finalized: Totals; // finished records only
  provisional: { activityId: string; categoryId: string; ms: number } | null;
  trackedMs: number; // finished + running, union
  untrackedMs: number; // elapsed − tracked
  gaps: Interval[]; // elapsed, untracked stretches
  overlaps: Array<{ a: string; b: string; ms: number }>;
  segments: Segment[];
  complete: boolean; // the whole day is in the past
};

export function categoryOf(lib: Library, activityId: string): string {
  return lib.activities.get(activityId)?.categoryId ?? UNKNOWN_CATEGORY;
}

function add(map: Map<string, number>, key: string, ms: number) {
  map.set(key, (map.get(key) ?? 0) + ms);
}

export function daySummary(
  records: TimeRecord[],
  lib: Library,
  date: LocalDate,
  timeZone: string,
  now: number,
): DaySummary {
  const { start, end } = dayBounds(date, timeZone);
  const elapsedEnd = Math.min(end, Math.max(start, now));
  const day = { start, end };

  const segments: Segment[] = [];
  for (const r of records) {
    const recEnd = r.end ?? now;
    if (r.end === null && r.start >= now) continue;
    const c = clip({ start: r.start, end: recEnd }, day);
    if (!c) continue;
    segments.push({
      recordId: r.id,
      activityId: r.activityId,
      categoryId: categoryOf(lib, r.activityId),
      start: c.start,
      end: c.end,
      provisional: r.end === null,
      continuesBefore: r.start < start,
      continuesAfter: recEnd > end,
    });
  }
  segments.sort((a, b) => a.start - b.start);

  const finalized: Totals = { byCategory: new Map(), byActivity: new Map(), trackedMs: 0 };
  const finishedIntervals: Interval[] = [];
  let provisional: DaySummary['provisional'] = null;
  for (const s of segments) {
    const ms = s.end - s.start;
    if (s.provisional) {
      provisional = { activityId: s.activityId, categoryId: s.categoryId, ms };
      continue;
    }
    add(finalized.byCategory, s.categoryId, ms);
    add(finalized.byActivity, s.activityId, ms);
    finishedIntervals.push(s);
  }
  finalized.trackedMs = totalLength(finishedIntervals);

  const elapsed = { start, end: elapsedEnd };
  const elapsedCovered = segments
    .map((s) => clip(s, elapsed))
    .filter((i): i is Interval => i !== null);
  const trackedMs = totalLength(segments);
  const untrackedMs = elapsedEnd - start - totalLength(elapsedCovered);

  const overlaps = findOverlaps(segments).map(([i, j]) => {
    const a = segments[i];
    const b = segments[j];
    return { a: a.recordId, b: b.recordId, ms: Math.min(a.end, b.end) - Math.max(a.start, b.start) };
  });

  return {
    date,
    start,
    end,
    lengthMs: end - start,
    elapsedMs: elapsedEnd - start,
    futureMs: end - elapsedEnd,
    finalized,
    provisional,
    trackedMs,
    untrackedMs,
    gaps: gaps(elapsed, segments),
    overlaps,
    segments,
    complete: now >= end,
  };
}

export type WeekSummary = {
  dates: LocalDate[];
  days: DaySummary[];
  lengthMs: number; // 168 h, or 167 / 169 h in a daylight-saving week
  elapsedMs: number;
  finalized: Totals;
  provisionalMs: number;
  trackedMs: number;
  untrackedMs: number;
  futureMs: number;
  completeDays: number;
  /** Days on which each category has any finalized time. */
  activeDaysByCategory: Map<string, number>;
  activeDaysByActivity: Map<string, number>;
};

export function summarizeDays(days: DaySummary[]): Omit<WeekSummary, 'dates' | 'days'> {
  const finalized: Totals = { byCategory: new Map(), byActivity: new Map(), trackedMs: 0 };
  const activeDaysByCategory = new Map<string, number>();
  const activeDaysByActivity = new Map<string, number>();
  let lengthMs = 0;
  let elapsedMs = 0;
  let provisionalMs = 0;
  let trackedMs = 0;
  let untrackedMs = 0;
  let futureMs = 0;
  let completeDays = 0;
  for (const d of days) {
    lengthMs += d.lengthMs;
    elapsedMs += d.elapsedMs;
    provisionalMs += d.provisional?.ms ?? 0;
    trackedMs += d.trackedMs;
    untrackedMs += d.untrackedMs;
    futureMs += d.futureMs;
    finalized.trackedMs += d.finalized.trackedMs;
    if (d.complete) completeDays++;
    for (const [k, v] of d.finalized.byCategory) {
      add(finalized.byCategory, k, v);
      if (v > 0) add(activeDaysByCategory, k, 1);
    }
    for (const [k, v] of d.finalized.byActivity) {
      add(finalized.byActivity, k, v);
      if (v > 0) add(activeDaysByActivity, k, 1);
    }
  }
  return {
    lengthMs,
    elapsedMs,
    finalized,
    provisionalMs,
    trackedMs,
    untrackedMs,
    futureMs,
    completeDays,
    activeDaysByCategory,
    activeDaysByActivity,
  };
}

export function weekSummary(
  records: TimeRecord[],
  lib: Library,
  anyDateInWeek: LocalDate,
  weekStartsOn: number,
  timeZone: string,
  now: number,
): WeekSummary {
  const dates = weekDates(anyDateInWeek, weekStartsOn);
  const days = dates.map((d) => daySummary(records, lib, d, timeZone, now));
  return { dates, days, ...summarizeDays(days) };
}

/**
 * Average per calendar day: total ÷ number of days, days with zero time included.
 * By default divides by the days that have fully happened (at least 1), so a week
 * in progress is not diluted by days that have not come yet.
 */
export function perCalendarDay(totalMs: number, days: number): number {
  return days > 0 ? totalMs / days : 0;
}

/** Average over the days on which the thing happened ("per commuting day"). */
export function perActiveDay(totalMs: number, activeDays: number): number {
  return activeDays > 0 ? totalMs / activeDays : 0;
}

/** Ranked list, most time first, for bar charts and "top three". */
export function ranked(map: Map<string, number>): Array<{ id: string; ms: number }> {
  return [...map.entries()]
    .filter(([, ms]) => ms > 0)
    .map(([id, ms]) => ({ id, ms }))
    .sort((a, b) => b.ms - a.ms || a.id.localeCompare(b.id));
}
