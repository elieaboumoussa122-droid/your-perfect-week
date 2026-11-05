// Display formatting. Totals are rounded to the minute here and only here.

import { MINUTE } from './tz.ts';

export function toMinutes(ms: number): number {
  return Math.round(ms / MINUTE);
}

/** 140 → "2 h 20 min", 45 → "45 min", 120 → "2 h". */
export function formatDuration(ms: number): string {
  const total = toMinutes(Math.abs(ms));
  const sign = ms < 0 && total > 0 ? '−' : '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h} h`;
  return `${sign}${h} h ${m} min`;
}

/** Signed difference in words: "40 min more", "1 h 5 min less", "the same". */
export function formatDelta(ms: number): string {
  if (toMinutes(ms) === 0) return 'the same';
  return `${formatDuration(Math.abs(ms))} ${ms > 0 ? 'more' : 'less'}`;
}

export function formatClock(ms: number, timeZone: string, hour12: boolean): string {
  return new Intl.DateTimeFormat(hour12 ? 'en-US' : 'en-GB', {
    timeZone,
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
  }).format(new Date(ms));
}

/** Minutes past local midnight → "07:15" or "7:15 AM" (wall clock, no zone needed). */
export function formatMinuteOfDay(minute: number, hour12: boolean): string {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (!hour12) return `${String(h).padStart(2, '0')}:${mm}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

export function percent(part: number, whole: number): string {
  if (whole <= 0) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}
