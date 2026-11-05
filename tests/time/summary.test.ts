import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daySummary, perActiveDay, perCalendarDay, ranked, UNKNOWN_CATEGORY, weekSummary } from '../../src/lib/time/summary.ts';
import { HOUR, localToInstant, MINUTE } from '../../src/lib/time/tz.ts';
import { makeLibrary, type TimeRecord } from '../../src/lib/time/types.ts';

const TZ = 'Asia/Beirut';
const lib = makeLibrary(
  [
    { id: 'sleep', name: 'Sleep', color: '#3730a3' },
    { id: 'work', name: 'Work', color: '#7c3aed' },
    { id: 'move', name: 'Commuting', color: '#eab308' },
    { id: 'screen', name: 'Screen time', color: '#f97316' },
  ],
  [
    { id: 'a-sleep', categoryId: 'sleep', name: 'Sleep' },
    { id: 'a-work', categoryId: 'work', name: 'Working' },
    { id: 'a-drive', categoryId: 'move', name: 'Driving' },
    { id: 'a-insta', categoryId: 'screen', name: 'Instagram', adjustable: true },
  ],
);
const at = (date: string, hhmm: string, tz = TZ) => {
  const [h, m] = hhmm.split(':').map(Number);
  return localToInstant(date, h * 60 + m, tz);
};
let n = 0;
const rec = (activityId: string, start: number, end: number | null): TimeRecord => ({ id: `r${++n}`, activityId, start, end });
const FAR_FUTURE = Date.UTC(2030, 0, 1);

test('a record crossing midnight is split between the two days', () => {
  const sleep = rec('a-sleep', at('2026-11-02', '23:00'), at('2026-11-03', '07:00'));
  const d1 = daySummary([sleep], lib, '2026-11-02', TZ, FAR_FUTURE);
  const d2 = daySummary([sleep], lib, '2026-11-03', TZ, FAR_FUTURE);
  assert.equal(d1.finalized.byCategory.get('sleep'), 60 * MINUTE);
  assert.equal(d2.finalized.byCategory.get('sleep'), 7 * HOUR);
  assert.equal(d1.segments[0].continuesAfter, true);
  assert.equal(d2.segments[0].continuesBefore, true);
});

test('day totals reconcile: tracked + untracked + future = day length', () => {
  const now = at('2026-11-03', '18:00');
  const records = [
    rec('a-sleep', at('2026-11-02', '23:00'), at('2026-11-03', '06:00')),
    rec('a-drive', at('2026-11-03', '07:15'), at('2026-11-03', '07:30')),
    rec('a-work', at('2026-11-03', '07:30'), at('2026-11-03', '12:30')),
    rec('a-work', at('2026-11-03', '13:00'), at('2026-11-03', '16:30')),
  ];
  const d = daySummary(records, lib, '2026-11-03', TZ, now);
  assert.equal(d.trackedMs, 6 * HOUR + 15 * MINUTE + 8.5 * HOUR);
  assert.equal(d.futureMs, 6 * HOUR);
  assert.equal(d.trackedMs + d.untrackedMs + d.futureMs, d.lengthMs);
  const categorySum = [...d.finalized.byCategory.values()].reduce((a, b) => a + b, 0);
  assert.equal(categorySum, d.finalized.trackedMs);
  assert.deepEqual(
    d.gaps.map((g) => [g.start, g.end]),
    [
      [at('2026-11-03', '06:00'), at('2026-11-03', '07:15')],
      [at('2026-11-03', '12:30'), at('2026-11-03', '13:00')],
      [at('2026-11-03', '16:30'), now],
    ],
  );
  assert.equal(d.complete, false);
});

test('a running timer is provisional, never in finalized totals', () => {
  const now = at('2026-11-03', '10:00');
  const d = daySummary([rec('a-work', at('2026-11-03', '08:00'), null)], lib, '2026-11-03', TZ, now);
  assert.equal(d.finalized.trackedMs, 0);
  assert.equal(d.finalized.byCategory.size, 0);
  assert.deepEqual(d.provisional, { activityId: 'a-work', categoryId: 'work', ms: 2 * HOUR });
  assert.equal(d.trackedMs, 2 * HOUR);
  assert.equal(d.untrackedMs, 8 * HOUR);
});

test('a timer left running overnight shows provisional time on each day', () => {
  const now = at('2026-11-04', '01:00');
  const r = rec('a-work', at('2026-11-03', '22:00'), null);
  assert.equal(daySummary([r], lib, '2026-11-03', TZ, now).provisional?.ms, 2 * HOUR);
  assert.equal(daySummary([r], lib, '2026-11-04', TZ, now).provisional?.ms, 1 * HOUR);
});

test('overlapping records are reported and not double counted', () => {
  const a = rec('a-work', at('2026-11-03', '09:00'), at('2026-11-03', '11:00'));
  const b = rec('a-insta', at('2026-11-03', '10:30'), at('2026-11-03', '11:30'));
  const d = daySummary([a, b], lib, '2026-11-03', TZ, FAR_FUTURE);
  assert.equal(d.finalized.trackedMs, 2.5 * HOUR);
  assert.equal(d.trackedMs, 2.5 * HOUR);
  assert.deepEqual(d.overlaps, [{ a: a.id, b: b.id, ms: 30 * MINUTE }]);
  assert.equal(d.trackedMs + d.untrackedMs + d.futureMs, d.lengthMs);
});

test('an activity that no longer exists is kept under an "unknown" category', () => {
  const d = daySummary([rec('gone', at('2026-11-03', '09:00'), at('2026-11-03', '10:00'))], lib, '2026-11-03', TZ, FAR_FUTURE);
  assert.equal(d.finalized.byCategory.get(UNKNOWN_CATEGORY), HOUR);
});

test('a fully tracked past day has zero untracked time', () => {
  const d = daySummary(
    [rec('a-sleep', at('2026-11-03', '00:00'), at('2026-11-04', '00:00'))],
    lib, '2026-11-03', TZ, FAR_FUTURE,
  );
  assert.equal(d.untrackedMs, 0);
  assert.deepEqual(d.gaps, []);
});

test('an empty past day is all untracked, an empty future day all future', () => {
  const past = daySummary([], lib, '2026-11-03', TZ, FAR_FUTURE);
  assert.equal(past.untrackedMs, 24 * HOUR);
  const future = daySummary([], lib, '2026-11-03', TZ, 0);
  assert.equal(future.untrackedMs, 0);
  assert.equal(future.futureMs, 24 * HOUR);
});

test('a week has 168 h, or 167 h when clocks go forward', () => {
  const normal = weekSummary([], lib, '2026-11-05', 1, TZ, FAR_FUTURE);
  assert.equal(normal.lengthMs, 168 * HOUR);
  const dst = weekSummary([], lib, '2026-03-26', 1, TZ, FAR_FUTURE); // week of Mon 23 March
  assert.equal(dst.lengthMs, 167 * HOUR);
  const back = weekSummary([], lib, '2026-10-22', 1, TZ, FAR_FUTURE);
  assert.equal(back.lengthMs, 169 * HOUR);
});

test('weekly totals equal the sum of the daily totals and the records', () => {
  const records: TimeRecord[] = [];
  for (let i = 0; i < 7; i++) {
    const d = `2026-11-0${2 + i}`;
    records.push(rec('a-sleep', at(d, '00:00'), at(d, '07:00')));
    if (i < 5) {
      records.push(rec('a-drive', at(d, '07:15'), at(d, '07:45')));
      records.push(rec('a-work', at(d, '08:00'), at(d, '17:00')));
      records.push(rec('a-drive', at(d, '17:00'), at(d, '17:30')));
    }
  }
  const w = weekSummary(records, lib, '2026-11-05', 1, TZ, FAR_FUTURE);
  assert.equal(w.finalized.byCategory.get('work'), 45 * HOUR);
  assert.equal(w.finalized.byCategory.get('move'), 5 * HOUR);
  assert.equal(w.finalized.byCategory.get('sleep'), 49 * HOUR);
  assert.equal(w.activeDaysByCategory.get('move'), 5);
  assert.equal(perActiveDay(w.finalized.byCategory.get('move')!, 5), HOUR); // 60 min per commuting day
  assert.equal(perCalendarDay(w.finalized.byCategory.get('work')!, 7), (45 * HOUR) / 7);
  const recordSum = records.reduce((s, r) => s + (r.end! - r.start), 0);
  assert.equal(w.finalized.trackedMs, recordSum);
  assert.equal(w.trackedMs + w.untrackedMs + w.futureMs, w.lengthMs);
  assert.equal(w.completeDays, 7);
});

test('week start day changes which records fall in the week', () => {
  const sunday = rec('a-work', at('2026-11-08', '10:00'), at('2026-11-08', '11:00'));
  assert.equal(weekSummary([sunday], lib, '2026-11-05', 1, TZ, FAR_FUTURE).finalized.trackedMs, HOUR);
  assert.equal(weekSummary([sunday], lib, '2026-11-05', 0, TZ, FAR_FUTURE).finalized.trackedMs, 0);
});

test('ranking orders by time, most first, and drops zeros', () => {
  const m = new Map([['a', 5], ['b', 50], ['c', 0], ['d', 50]]);
  assert.deepEqual(ranked(m).map((x) => x.id), ['b', 'd', 'a']);
});

test('category reassignment changes history consistently (category follows the activity)', () => {
  const r = rec('a-insta', at('2026-11-03', '20:00'), at('2026-11-03', '21:00'));
  const moved = makeLibrary([...lib.categories.values()], [
    ...[...lib.activities.values()].filter((a) => a.id !== 'a-insta'),
    { id: 'a-insta', categoryId: 'work', name: 'Instagram (work account)' },
  ]);
  assert.equal(daySummary([r], lib, '2026-11-03', TZ, FAR_FUTURE).finalized.byCategory.get('screen'), HOUR);
  assert.equal(daySummary([r], moved, '2026-11-03', TZ, FAR_FUTURE).finalized.byCategory.get('work'), HOUR);
});
