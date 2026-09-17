// A habit is either a plain check-off or a *quantity* habit with a daily
// target ("10 pages"). Each day's log carries a `value`:
//   undefined -> nothing logged that day
//   null      -> a plain check (also what old logs hold if a habit is later
//                given a target; they still count as done)
//   number    -> the amount logged for a quantity habit

export function isQuantityHabit(habit) {
  return habit.target_value != null && Number(habit.target_value) > 0;
}

export function isLogDone(habit, value) {
  if (value === undefined) return false;
  if (!isQuantityHabit(habit) || value === null) return true;
  return Number(value) >= Number(habit.target_value);
}

// The date keys that count towards streaks / week dots.
export function doneDateKeys(habit, logs) {
  return logs.filter((l) => isLogDone(habit, l.value)).map((l) => l.date);
}

export function formatTarget(habit) {
  const target = Number(habit.target_value);
  const n = Number.isInteger(target) ? target : target.toString();
  return habit.unit ? `${n} ${habit.unit}` : String(n);
}
