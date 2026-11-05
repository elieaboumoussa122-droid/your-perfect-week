// Time-zone and calendar-date helpers.
//
// Every instant is a number of milliseconds since the Unix epoch (UTC).
// Every calendar date is a 'YYYY-MM-DD' string, interpreted in an IANA time zone.
// No dependency: the platform's Intl database does the zone math, so daylight-saving
// days are 23 or 25 hours long, and zones that change clocks at midnight
// (e.g. Asia/Beirut, America/Havana) still get a correct start of day.

export type LocalDate = string; // 'YYYY-MM-DD'

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY_MS = 24 * HOUR;

export type WallClock = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock reading in `timeZone` at instant `ms`. */
export function wallClock(ms: number, timeZone: string): WallClock {
  const parts = formatter(timeZone).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** UTC offset of `timeZone` at instant `ms`, in minutes (Beirut summer = +180). */
export function offsetMinutes(ms: number, timeZone: string): number {
  const w = wallClock(ms, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  const wholeSecond = Math.floor(ms / 1000) * 1000;
  return Math.round((asUtc - wholeSecond) / MINUTE);
}

export function parseDate(date: LocalDate): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date: ${date}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${date}`);
  }
  return { year, month, day };
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function formatDate(year: number, month: number, day: number): LocalDate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const { year, month, day } = parseDate(date);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Whole days from `a` to `b` (b - a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round(
    (Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / DAY_MS,
  );
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: LocalDate): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The calendar date in `timeZone` at instant `ms`. */
export function localDateOf(ms: number, timeZone: string): LocalDate {
  const w = wallClock(ms, timeZone);
  return formatDate(w.year, w.month, w.day);
}

/** Minutes since local midnight's wall reading (0-1439) at instant `ms`. */
export function localMinuteOfDay(ms: number, timeZone: string): number {
  const w = wallClock(ms, timeZone);
  return w.hour * 60 + w.minute;
}

/**
 * The instant at which the wall clock in `timeZone` reads `date` + `minuteOfDay`.
 * - A wall time that occurs twice (clocks going back) resolves to the earlier instant.
 * - A wall time that does not exist (clocks going forward) moves forward by the gap,
 *   so local midnight on a day whose clocks jump 00:00 → 01:00 resolves to the instant
 *   the day actually starts.
 * `minuteOfDay` may be ≥ 1440 or negative; it rolls into neighbouring dates.
 */
export function localToInstant(date: LocalDate, minuteOfDay: number, timeZone: string): number {
  const { year, month, day } = parseDate(date);
  const guess = Date.UTC(year, month - 1, day, 0, minuteOfDay);
  const before = offsetMinutes(guess - DAY_MS, timeZone);
  const after = offsetMinutes(guess + DAY_MS, timeZone);
  const target = wallKey(wallClockOfUtcFields(guess));
  const candidates = [...new Set([guess - before * MINUTE, guess - after * MINUTE])]
    .filter((c) => wallKey(wallClock(c, timeZone)) === target)
    .sort((a, b) => a - b);
  if (candidates.length > 0) return candidates[0];
  // Wall time skipped by a forward transition: apply the offset in force before it.
  return guess - before * MINUTE;
}

function wallClockOfUtcFields(ms: number): WallClock {
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

function wallKey(w: WallClock): string {
  return `${w.year}-${w.month}-${w.day} ${w.hour}:${w.minute}`;
}

/** [start, end) of a local calendar day, as instants. */
export function dayBounds(date: LocalDate, timeZone: string): { start: number; end: number } {
  return {
    start: localToInstant(date, 0, timeZone),
    end: localToInstant(addDays(date, 1), 0, timeZone),
  };
}

/** The first date of the week containing `date`; `weekStartsOn` 0 = Sunday, 1 = Monday … */
export function weekStartDate(date: LocalDate, weekStartsOn: number): LocalDate {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new Error(`Invalid week start: ${weekStartsOn}`);
  }
  const back = (weekdayOf(date) - weekStartsOn + 7) % 7;
  return addDays(date, -back);
}

export function weekDates(date: LocalDate, weekStartsOn: number): LocalDate[] {
  const first = weekStartDate(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export function monthDates(date: LocalDate): LocalDate[] {
  const { year, month } = parseDate(date);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => formatDate(year, month, i + 1));
}
