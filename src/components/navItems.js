// `label` is used in the desktop sidebar; `shortLabel` (when present) in the
// phone tab bar, where six items share ~360px. Keys are stable internal ids
// (the Calendar tab's code still lives under features/planner).
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { key: 'planner', label: 'Calendar' },
  { key: 'todos', label: 'To-Do' },
  { key: 'habits', label: 'Habits' },
  { key: 'goals', label: 'Goals' },
  { key: 'notes', label: 'Notes' },
];
