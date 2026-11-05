// Shapes the calculation engine works on. They mirror the database rows
// (supabase/migrations) with timestamps converted to epoch milliseconds.

export type ActivityClass = 'essential' | 'flexible' | 'discretionary' | 'recovery';

export type Category = {
  id: string;
  name: string;
  color: string; // '#rrggbb'
};

export type Activity = {
  id: string;
  categoryId: string;
  name: string;
  color?: string | null; // falls back to the category colour
  defaultDurationMin?: number | null;
  activityClass?: ActivityClass | null;
  adjustable?: boolean; // chosen by the person, never inferred
};

export type RecordSource = 'manual' | 'timer' | 'retro' | 'template' | 'suggestion' | 'import';

/** A recorded (actual) block of time. `end === null` means the timer is still running. */
export type TimeRecord = {
  id: string;
  activityId: string;
  start: number;
  end: number | null;
  source?: RecordSource;
};

/** A block in an ideal week or a recurring plan: wall-clock based, not an instant. */
export type PlannedBlock = {
  weekday: number; // 0 = Sunday … 6 = Saturday
  startMinute: number; // 0-1439, local wall clock
  durationMin: number;
  activityId?: string | null;
  categoryId?: string | null;
};

export type Library = {
  categories: Map<string, Category>;
  activities: Map<string, Activity>;
};

export function makeLibrary(categories: Category[], activities: Activity[]): Library {
  return {
    categories: new Map(categories.map((c) => [c.id, c])),
    activities: new Map(activities.map((a) => [a.id, a])),
  };
}
