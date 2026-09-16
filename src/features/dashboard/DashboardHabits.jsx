import ProgressRing from '../habits/ProgressRing.jsx';
import { useHabitLogMutations } from '../habits/useHabitsData.js';
import { paletteColorValue } from '../../lib/colorPalette.js';

// Phone-only compact Habits block for the top of the Dashboard: the day's
// progress ring plus one tappable chip per habit. Tapping a chip logs or
// un-logs the habit for today, so the most common daily action never
// needs a trip to the Habits page.
function HabitChip({ habit, done, todayKey }) {
  const { log, unlog } = useHabitLogMutations(habit.id);
  const color = paletteColorValue(habit.color);

  return (
    <button
      type="button"
      className={done ? 'dashboard-habit-chip done' : 'dashboard-habit-chip'}
      style={{ '--chip-color': color }}
      onClick={() => (done ? unlog.mutate(todayKey) : log.mutate(todayKey))}
      aria-pressed={done}
      aria-label={`${habit.name}: ${done ? 'done today, tap to undo' : 'not done today, tap to mark done'}`}
      title={habit.name}
    >
      <span className="dashboard-habit-chip-avatar">{habit.icon || habit.name.charAt(0).toUpperCase()}</span>
      {done && <span className="dashboard-habit-chip-check">✓</span>}
    </button>
  );
}

export default function DashboardHabits({ habits, doneToday, todayKey, longestStreak, onOpen }) {
  const doneCount = habits.filter((h) => doneToday.has(h.id)).length;

  return (
    <div className="card dashboard-habits-compact">
      <div className="dashboard-card-header">
        <button type="button" className="dashboard-habits-compact-title" onClick={onOpen}>
          Habits <span aria-hidden="true">›</span>
        </button>
        {longestStreak > 0 && <span className="text-muted dashboard-card-header-stat">🔥 {longestStreak} day streak</span>}
      </div>

      {habits.length === 0 ? (
        <p className="text-muted">No habits yet.</p>
      ) : (
        <div className="dashboard-habits-compact-body">
          <ProgressRing
            value={doneCount}
            total={habits.length}
            size={76}
            strokeWidth={7}
            centerText={`${doneCount} of ${habits.length}`}
          />
          <div className="dashboard-habit-chips">
            {habits.map((habit) => (
              <HabitChip key={habit.id} habit={habit} done={doneToday.has(habit.id)} todayKey={todayKey} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
