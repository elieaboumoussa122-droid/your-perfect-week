// The starter library offered during onboarding. People keep, rename, recolour or
// remove any of it; nothing is created until they confirm.
// Colours were chosen to stay distinguishable next to each other in light and dark mode;
// each activity colour is checked for contrast against its text in the design system.

import type { ActivityClass } from './time/types.ts';

export type DefaultCategory = { key: string; name: string; color: string; icon: string };
export type DefaultActivity = {
  name: string;
  category: string;
  defaultDurationMin: number;
  activityClass: ActivityClass;
  adjustable: boolean;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { key: 'work', name: 'Work', color: '#7c3aed', icon: 'briefcase' },
  { key: 'sleep', name: 'Sleep', color: '#3730a3', icon: 'moon' },
  { key: 'meals', name: 'Meals', color: '#ea580c', icon: 'utensils' },
  { key: 'care', name: 'Personal care', color: '#0ea5e9', icon: 'droplet' },
  { key: 'commute', name: 'Commuting', color: '#ca8a04', icon: 'car' },
  { key: 'health', name: 'Exercise & health', color: '#16a34a', icon: 'activity' },
  { key: 'family', name: 'Family & relationships', color: '#db2777', icon: 'heart' },
  { key: 'screen', name: 'Screen time & entertainment', color: '#f43f5e', icon: 'smartphone' },
  { key: 'learning', name: 'Learning', color: '#0d9488', icon: 'book' },
  { key: 'home', name: 'Household', color: '#92400e', icon: 'home' },
  { key: 'downtime', name: 'Downtime', color: '#a78bfa', icon: 'coffee' },
];

export const DEFAULT_ACTIVITIES: DefaultActivity[] = [
  { name: 'Sleep', category: 'sleep', defaultDurationMin: 480, activityClass: 'recovery', adjustable: false },
  { name: 'Working', category: 'work', defaultDurationMin: 240, activityClass: 'essential', adjustable: false },
  { name: 'Work emails', category: 'work', defaultDurationMin: 30, activityClass: 'flexible', adjustable: false },
  { name: 'Breakfast', category: 'meals', defaultDurationMin: 30, activityClass: 'essential', adjustable: false },
  { name: 'Lunch', category: 'meals', defaultDurationMin: 30, activityClass: 'essential', adjustable: false },
  { name: 'Dinner', category: 'meals', defaultDurationMin: 45, activityClass: 'essential', adjustable: false },
  { name: 'Hygiene', category: 'care', defaultDurationMin: 30, activityClass: 'essential', adjustable: false },
  { name: 'Getting dressed', category: 'care', defaultDurationMin: 15, activityClass: 'essential', adjustable: false },
  { name: 'Driving', category: 'commute', defaultDurationMin: 30, activityClass: 'essential', adjustable: false },
  { name: 'Exercise', category: 'health', defaultDurationMin: 60, activityClass: 'recovery', adjustable: false },
  { name: 'Family time', category: 'family', defaultDurationMin: 60, activityClass: 'essential', adjustable: false },
  { name: 'Social media', category: 'screen', defaultDurationMin: 15, activityClass: 'discretionary', adjustable: true },
  { name: 'TV & streaming', category: 'screen', defaultDurationMin: 60, activityClass: 'discretionary', adjustable: true },
  { name: 'Reading & study', category: 'learning', defaultDurationMin: 45, activityClass: 'flexible', adjustable: false },
  { name: 'Chores', category: 'home', defaultDurationMin: 30, activityClass: 'essential', adjustable: false },
  { name: 'Rest', category: 'downtime', defaultDurationMin: 30, activityClass: 'recovery', adjustable: false },
];

export const PRIORITY_OPTIONS = [
  'Exercise', 'Family', 'Sleep', 'Learning', 'Business development', 'Hobbies', 'Social life', 'Recovery',
] as const;
