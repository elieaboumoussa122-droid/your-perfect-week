// Recurring activities and routine templates. Both produce *drafts*: proposed
// blocks the person confirms. Nothing here creates a recorded activity by itself.

import { addDays, daysBetween, localToInstant, weekdayOf, type LocalDate } from './tz.ts';

export type Recurrence = {
  activityId: string;
  weekdays: number[]; // 0 = Sunday … 6 = Saturday
  startMinute: number; // local wall clock
  durationMin: number;
  startsOn: LocalDate;
  endsOn?: LocalDate | null;
  intervalWeeks?: number; // 1 = every week, 2 = every other week …
};

export type Draft = { activityId: string; start: number; end: number; date: LocalDate };

export function occursOn(r: Recurrence, date: LocalDate): boolean {
  if (daysBetween(r.startsOn, date) < 0) return false;
  if (r.endsOn && daysBetween(date, r.endsOn) < 0) return false;
  if (!r.weekdays.includes(weekdayOf(date))) return false;
  const every = Math.max(1, r.intervalWeeks ?? 1);
  if (every === 1) return true;
  // Weeks counted from the week of startsOn (Sunday-based, stable).
  const anchor = addDays(r.startsOn, -weekdayOf(r.startsOn));
  const week = Math.floor(daysBetween(anchor, date) / 7);
  return week % every === 0;
}

export function expandRecurrences(rules: Recurrence[], dates: LocalDate[], timeZone: string): Draft[] {
  const out: Draft[] = [];
  for (const date of dates) {
    for (const r of rules) {
      if (!occursOn(r, date)) continue;
      out.push({
        activityId: r.activityId,
        date,
        start: localToInstant(date, r.startMinute, timeZone),
        end: localToInstant(date, r.startMinute + r.durationMin, timeZone),
      });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

export type RoutineItem = { activityId: string; offsetMin: number; durationMin: number };

/** A routine laid on a date from a start time. Offsets are wall-clock minutes. */
export function applyRoutine(
  items: RoutineItem[],
  date: LocalDate,
  startMinute: number,
  timeZone: string,
): Draft[] {
  return items
    .map((i) => ({
      activityId: i.activityId,
      date,
      start: localToInstant(date, startMinute + i.offsetMin, timeZone),
      end: localToInstant(date, startMinute + i.offsetMin + i.durationMin, timeZone),
    }))
    .filter((d) => d.end > d.start)
    .sort((a, b) => a.start - b.start);
}
