import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  actualVsIdeal,
  baseline,
  expandPlanned,
  findTimeSignals,
  heatmap,
  simulate,
  suggestions,
  weekOverWeek,
} from '../../src/lib/time/analysis.ts';
import { gaps, planMakeRoom, union } from '../../src/lib/time/intervals.ts';
import { applyRoutine, expandRecurrences, occursOn } from '../../src/lib/time/plan.ts';
import { formatDelta, formatDuration, formatMinuteOfDay } from '../../src/lib/time/format.ts';
import { daySummary, weekSummary } from '../../src/lib/time/summary.ts';
import { addDays, HOUR, localToInstant, MINUTE, weekDates } from '../../src/lib/time/tz.ts';
import { makeLibrary, type TimeRecord } from '../../src/lib/time/types.ts';

const TZ = 'Asia/Beirut';
const lib = makeLibrary(
  [
    { id: 'work', name: 'Work', color: '#7c3aed' },
    { id: 'move', name: 'Commuting', color: '#eab308' },
    { id: 'screen', name: 'Screen time', color: '#f97316' },
    { id: 'health', name: 'Exercise', color: '#16a34a' },
  ],
  [
    { id: 'a-work', categoryId: 'work', name: 'Working' },
    { id: 'a-drive', categoryId: 'move', name: 'Driving' },
    { id: 'a-insta', categoryId: 'screen', name: 'Instagram', adjustable: true, defaultDurationMin: 10 },
    { id: 'a-gym', categoryId: 'health', name: 'Gym' },
  ],
);
const at = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return localToInstant(date, h * 60 + m, TZ);
};
let n = 0;
const rec = (activityId: string, start: number, end: number | null): TimeRecord => ({ id: `r${++n}`, activityId, start, end });
const FAR_FUTURE = Date.UTC(2030, 0, 1);

test('simulator: 20 min × 7 days = 2 h 20 min a week; annual is labelled an estimate', () => {
  const s = simulate([{ label: 'Social media', minutesPerDay: 20, daysPerWeek: 7 }]);
  assert.equal(s.weeklyMin, 140);
  assert.equal(formatDuration(s.weeklyMin * MINUTE), '2 h 20 min');
  assert.equal(s.annualEstimateMin, 140 * 52);
});

test('simulator: several changes, allocation to priorities, and reality check', () => {
  const s = simulate(
    [
      { label: 'Scrolling', minutesPerDay: 30, daysPerWeek: 5, recordedWeeklyMs: 2 * HOUR },
      { label: 'TV', minutesPerDay: 15, daysPerWeek: 2 },
    ],
    [{ priority: 'Exercise', weeklyMin: 150 }, { priority: 'Reading', weeklyMin: 60 }],
  );
  assert.equal(s.weeklyMin, 180);
  assert.equal(s.rows[0].exceedsRecorded, true); // 150 min planned cut > 120 min recorded
  assert.deepEqual(s.allocations, [{ priority: 'Exercise', weeklyMin: 150 }, { priority: 'Reading', weeklyMin: 30 }]);
  assert.equal(s.unallocatedWeeklyMin, 0);
  const clamped = simulate([{ label: 'x', minutesPerDay: -5, daysPerWeek: 9 }]);
  assert.equal(clamped.weeklyMin, 0);
});

test('baseline ignores incomplete days and barely-logged days', () => {
  const days = ['2026-11-02', '2026-11-03', '2026-11-04'].map((d, i) =>
    daySummary(
      [
        rec('a-work', at(d, '08:00'), at(d, i === 2 ? '08:30' : '16:00')),
        rec('a-insta', at(d, '20:00'), at(d, '21:00')),
      ],
      lib, d, TZ, FAR_FUTURE,
    ),
  );
  const b = baseline(days, 'screen', 'category');
  assert.equal(b.days, 2); // the 1.5 h day is below the 4 h minimum
  assert.equal(b.avgMs, HOUR);
});

test('week over week compares per-day averages while the week is in progress', () => {
  const prevRecords: TimeRecord[] = weekDates('2026-10-26', 1).map((d) => rec('a-insta', at(d, '21:00'), at(d, '22:00')));
  const curRecords: TimeRecord[] = ['2026-11-02', '2026-11-03'].map((d) => rec('a-insta', at(d, '21:00'), at(d, '23:00')));
  const now = at('2026-11-04', '12:00');
  const prev = weekSummary(prevRecords, lib, '2026-10-26', 1, TZ, now);
  const cur = weekSummary(curRecords, lib, '2026-11-02', 1, TZ, now);
  const w = weekOverWeek(cur, prev);
  assert.equal(w.partial, true);
  assert.equal(w.daysCompared, 2);
  assert.equal(w.deltas[0].id, 'screen');
  assert.equal(w.deltas[0].deltaMs, HOUR); // 2 h/day vs 1 h/day
  assert.equal(formatDelta(w.deltas[0].deltaMs), '1 h more');
});

test('heatmap splits records by local hour and weekday', () => {
  const r = rec('a-gym', at('2026-11-03', '17:30'), at('2026-11-03', '18:45'));
  const grid = heatmap([r], lib, '2026-11-02', '2026-11-08', TZ);
  assert.equal(grid[2][17], 30); // Tuesday
  assert.equal(grid[2][18], 45);
  assert.equal(grid.flat().reduce((a, b) => a + b, 0), 75);
});

test('Find My Time only offers adjustable activities and reports priority gaps', () => {
  const records: TimeRecord[] = [];
  for (const d of weekDates('2026-11-02', 1)) {
    records.push(rec('a-work', at(d, '08:00'), at(d, '16:00')));
    for (const t of ['12:00', '18:00']) records.push(rec('a-insta', at(d, t), at(d, t.replace(':00', ':15'))));
    records.push(rec('a-insta', at(d, '22:00'), at(d, '22:30')));
  }
  const week = weekSummary(records, lib, '2026-11-02', 1, TZ, FAR_FUTURE);
  const signals = findTimeSignals({
    week,
    records,
    lib,
    priorities: [{ categoryId: 'health', targetMsPerWeek: 4 * HOUR }],
    timeZone: TZ,
  });
  const kinds = signals.map((s) => s.kind).sort();
  assert.ok(kinds.includes('small-blocks-add-up'));
  assert.ok(kinds.includes('over-preferred'));
  assert.ok(kinds.includes('priority-gap'));
  assert.ok(signals.every((s) => !('activityId' in s) || s.activityId === 'a-insta'), 'work is never offered');
});

test('actual vs ideal: planned 4 h exercise, recorded 2 h 30 min', () => {
  const records = [
    rec('a-gym', at('2026-11-03', '17:00'), at('2026-11-03', '18:00')),
    rec('a-gym', at('2026-11-05', '17:00'), at('2026-11-05', '18:30')),
  ];
  const week = weekSummary(records, lib, '2026-11-02', 1, TZ, FAR_FUTURE);
  const ideal = [1, 2, 4, 6].map((weekday) => ({ weekday, startMinute: 17 * 60, durationMin: 60, activityId: 'a-gym' }));
  const row = actualVsIdeal(week, ideal, lib).find((r) => r.categoryId === 'health')!;
  assert.equal(row.plannedMs, 4 * HOUR);
  assert.equal(row.recordedMs, 2.5 * HOUR);
  assert.equal(formatDuration(row.recordedMs), '2 h 30 min');
  const laid = expandPlanned(ideal, weekDates('2026-11-02', 1), TZ);
  assert.equal(laid.length, 4);
  assert.equal(laid[0].start, at('2026-11-02', '17:00'));
});

test('suggestions need 3 similar days, respect the day type, and skip what is already logged', () => {
  const records: TimeRecord[] = [];
  for (const d of ['2026-10-27', '2026-10-28', '2026-10-29', '2026-11-02']) {
    records.push(rec('a-drive', at(d, '07:10'), at(d, '07:40')));
  }
  records.push(rec('a-gym', at('2026-11-01', '09:00'), at('2026-11-01', '10:00'))); // Sunday, other day type
  const now = at('2026-11-03', '07:20');
  const s = suggestions(records, '2026-11-03', TZ, now);
  assert.equal(s.length, 1);
  assert.equal(s[0].activityId, 'a-drive');
  assert.equal(formatMinuteOfDay(s[0].usualStartMinute, false), '07:10');
  assert.equal(s[0].usualDurationMin, 30);
  const logged = [...records, rec('a-drive', at('2026-11-03', '07:00'), at('2026-11-03', '07:20'))];
  assert.equal(suggestions(logged, '2026-11-03', TZ, now).length, 0);
  assert.equal(suggestions(records, '2026-11-03', TZ, at('2026-11-03', '06:00')).length, 0, 'not before the usual time');
});

test('making room for a new record: trim, split or delete, never silently', () => {
  const existing = [
    { id: 'x', start: 0, end: 100 },
    { id: 'y', start: 100, end: 200 },
    { id: 'z', start: 300, end: 400 },
  ];
  const plan = planMakeRoom({ start: 50, end: 150 }, existing);
  assert.deepEqual(plan.map((p) => p.kind), ['trim', 'trim']);
  assert.deepEqual(planMakeRoom({ start: 320, end: 340 }, existing)[0].kind, 'split');
  assert.deepEqual(planMakeRoom({ start: 290, end: 410 }, existing)[0].kind, 'delete');
  assert.deepEqual(planMakeRoom({ start: 200, end: 300 }, existing), []);
});

test('interval union and gaps', () => {
  assert.deepEqual(union([{ start: 5, end: 10 }, { start: 0, end: 5 }, { start: 20, end: 30 }]), [
    { start: 0, end: 10 },
    { start: 20, end: 30 },
  ]);
  assert.deepEqual(gaps({ start: 0, end: 40 }, [{ start: 10, end: 20 }]), [
    { start: 0, end: 10 },
    { start: 20, end: 40 },
  ]);
});

test('recurrence: weekdays, every other week, end date, crossing midnight', () => {
  const rule = { activityId: 'a-gym', weekdays: [1, 3], startMinute: 23 * 60, durationMin: 90, startsOn: '2026-11-02', intervalWeeks: 2 };
  assert.equal(occursOn(rule, '2026-11-02'), true);
  assert.equal(occursOn(rule, '2026-11-04'), true);
  assert.equal(occursOn(rule, '2026-11-09'), false);
  assert.equal(occursOn(rule, '2026-11-16'), true);
  assert.equal(occursOn({ ...rule, endsOn: '2026-11-10' }, '2026-11-16'), false);
  assert.equal(occursOn(rule, '2026-10-26'), false);
  const drafts = expandRecurrences([rule], weekDates('2026-11-02', 1), TZ);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].end - drafts[0].start, 90 * MINUTE);
  assert.equal(drafts[0].end, at(addDays('2026-11-02', 1), '00:30'));
});

test('routine template becomes drafts from a chosen start time', () => {
  const drafts = applyRoutine(
    [
      { activityId: 'a-drive', offsetMin: 30, durationMin: 15 },
      { activityId: 'a-work', offsetMin: 45, durationMin: 300 },
    ],
    '2026-11-03', 6 * 60 + 30, TZ,
  );
  assert.deepEqual(drafts.map((d) => [d.activityId, d.start, d.end]), [
    ['a-drive', at('2026-11-03', '07:00'), at('2026-11-03', '07:15')],
    ['a-work', at('2026-11-03', '07:15'), at('2026-11-03', '12:15')],
  ]);
});

test('formatting', () => {
  assert.equal(formatDuration(0), '0 min');
  assert.equal(formatDuration(45 * MINUTE), '45 min');
  assert.equal(formatDuration(2 * HOUR), '2 h');
  assert.equal(formatDuration(100 * MINUTE + 29_000), '1 h 40 min');
  assert.equal(formatMinuteOfDay(17 * 60, true), '5:00 PM');
  assert.equal(formatMinuteOfDay(0, true), '12:00 AM');
  assert.equal(formatMinuteOfDay(12 * 60 + 5, true), '12:05 PM');
  assert.equal(formatDelta(40 * MINUTE), '40 min more');
  assert.equal(formatDelta(-65 * MINUTE), '1 h 5 min less');
});
