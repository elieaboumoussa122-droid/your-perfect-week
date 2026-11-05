import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  dayBounds,
  HOUR,
  localDateOf,
  localToInstant,
  monthDates,
  offsetMinutes,
  weekDates,
  weekStartDate,
  weekdayOf,
} from '../../src/lib/time/tz.ts';

const iso = (ms: number) => new Date(ms).toISOString();

test('ordinary day is 24 h and starts at local midnight', () => {
  const b = dayBounds('2026-11-05', 'Asia/Beirut');
  assert.equal(iso(b.start), '2026-11-04T22:00:00.000Z'); // +02:00 in winter
  assert.equal(b.end - b.start, 24 * HOUR);
});

test('clocks jump forward at midnight (Beirut): day starts at 01:00, lasts 23 h', () => {
  const b = dayBounds('2026-03-29', 'Asia/Beirut');
  assert.equal(iso(b.start), '2026-03-28T22:00:00.000Z');
  assert.equal(b.end - b.start, 23 * HOUR);
  assert.equal(localDateOf(b.start, 'Asia/Beirut'), '2026-03-29');
  assert.equal(localDateOf(b.start - 1, 'Asia/Beirut'), '2026-03-28');
});

test('clocks go back at midnight (Beirut): the day before lasts 25 h', () => {
  const b = dayBounds('2026-10-24', 'Asia/Beirut');
  assert.equal(b.end - b.start, 25 * HOUR);
});

test('US daylight saving: 23 h in March, 25 h in November', () => {
  const m = dayBounds('2026-03-08', 'America/New_York');
  const n = dayBounds('2026-11-01', 'America/New_York');
  assert.equal(m.end - m.start, 23 * HOUR);
  assert.equal(n.end - n.start, 25 * HOUR);
});

test('half-hour daylight saving shift (Lord Howe) gives a 24.5 h day', () => {
  const b = dayBounds('2026-04-05', 'Australia/Lord_Howe');
  assert.equal(b.end - b.start, 24.5 * HOUR);
});

test('ambiguous wall time resolves to the earlier instant', () => {
  // 01:30 happens twice in New York on 2026-11-01.
  const t = localToInstant('2026-11-01', 90, 'America/New_York');
  assert.equal(iso(t), '2026-11-01T05:30:00.000Z');
  assert.equal(offsetMinutes(t, 'America/New_York'), -240);
});

test('skipped wall time moves forward by the gap', () => {
  // 02:30 does not exist in New York on 2026-03-08 → 03:30 EDT.
  const t = localToInstant('2026-03-08', 150, 'America/New_York');
  assert.equal(iso(t), '2026-03-08T07:30:00.000Z');
});

test('dates roll over months and leap years', () => {
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2027-02-28', 1), '2027-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(monthDates('2028-02-10').length, 29);
  assert.throws(() => addDays('2026-02-30', 0));
});

test('week start respects the chosen first day', () => {
  assert.equal(weekdayOf('2026-11-05'), 4); // Thursday
  assert.equal(weekStartDate('2026-11-05', 1), '2026-11-02'); // Monday
  assert.equal(weekStartDate('2026-11-05', 0), '2026-11-01'); // Sunday
  assert.equal(weekStartDate('2026-11-05', 6), '2026-10-31'); // Saturday
  assert.equal(weekStartDate('2026-11-02', 1), '2026-11-02');
  assert.deepEqual(weekDates('2026-11-05', 1), [
    '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
  ]);
});
