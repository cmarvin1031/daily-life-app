import { addDays, toDateKey } from '../../lib/dateUtils.js';

// Counts consecutive logged days ending today. If today isn't logged yet,
// counting starts from yesterday so an in-progress day doesn't look like a
// broken streak.
export function computeStreak(loggedDates, referenceDate = new Date()) {
  const logged = new Set(loggedDates);
  let streak = 0;
  let cursor = new Date(referenceDate);
  if (!logged.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (logged.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Last 7 days (oldest -> newest, ending today) with logged status -- the
// data behind each habit's week-strip, shared by the Habits page rows and
// the Dashboard's habit list so they always match.
export function getLast7Days(loggedDates) {
  const logged = new Set(loggedDates);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const key = toDateKey(d);
    days.push({ key, done: logged.has(key) });
  }
  return days;
}
