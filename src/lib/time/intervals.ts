// Interval arithmetic on half-open ranges [start, end) of instants (ms).

export type Interval = { start: number; end: number };

export function length(i: Interval): number {
  return Math.max(0, i.end - i.start);
}

export function clip(i: Interval, to: Interval): Interval | null {
  const start = Math.max(i.start, to.start);
  const end = Math.min(i.end, to.end);
  return end > start ? { start, end } : null;
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Sorted, non-overlapping union. Touching intervals are merged. */
export function union(intervals: Interval[]): Interval[] {
  const sorted = intervals.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else out.push({ start: i.start, end: i.end });
  }
  return out;
}

export function totalLength(intervals: Interval[]): number {
  return union(intervals).reduce((sum, i) => sum + length(i), 0);
}

/** Parts of `within` not covered by any of `covered`. */
export function gaps(within: Interval, covered: Interval[]): Interval[] {
  const out: Interval[] = [];
  let cursor = within.start;
  for (const c of union(covered.map((i) => clip(i, within)).filter((i): i is Interval => i !== null))) {
    if (c.start > cursor) out.push({ start: cursor, end: c.start });
    cursor = Math.max(cursor, c.end);
  }
  if (cursor < within.end) out.push({ start: cursor, end: within.end });
  return out;
}

export type Change<T> =
  | { kind: 'delete'; record: T }
  | { kind: 'trim'; record: T; start: number; end: number }
  | { kind: 'split'; record: T; first: Interval; second: Interval };

/**
 * What would have to change in `existing` so that `incoming` fits without overlap.
 * Pure: nothing is applied. The UI shows these as a conflict and the person chooses.
 */
export function planMakeRoom<T extends Interval>(incoming: Interval, existing: T[]): Change<T>[] {
  const changes: Change<T>[] = [];
  for (const r of existing) {
    if (!overlaps(r, incoming)) continue;
    const keepsStart = r.start < incoming.start;
    const keepsEnd = r.end > incoming.end;
    if (keepsStart && keepsEnd) {
      changes.push({
        kind: 'split',
        record: r,
        first: { start: r.start, end: incoming.start },
        second: { start: incoming.end, end: r.end },
      });
    } else if (keepsStart) {
      changes.push({ kind: 'trim', record: r, start: r.start, end: incoming.start });
    } else if (keepsEnd) {
      changes.push({ kind: 'trim', record: r, start: incoming.end, end: r.end });
    } else {
      changes.push({ kind: 'delete', record: r });
    }
  }
  return changes;
}

/** Every pair of overlapping intervals (by index). */
export function findOverlaps(intervals: Interval[]): Array<[number, number]> {
  const idx = intervals.map((_, i) => i).sort((a, b) => intervals[a].start - intervals[b].start);
  const pairs: Array<[number, number]> = [];
  for (let x = 0; x < idx.length; x++) {
    for (let y = x + 1; y < idx.length; y++) {
      const a = intervals[idx[x]];
      const b = intervals[idx[y]];
      if (b.start >= a.end) break;
      if (overlaps(a, b)) pairs.push([idx[x], idx[y]].sort((m, n) => m - n) as [number, number]);
    }
  }
  return pairs;
}
