import ProgressRing from '../habits/ProgressRing.jsx';
import { useHabitLogMutations } from '../habits/useHabitsData.js';
import { paletteColorValue } from '../../lib/colorPalette.js';

// Phone-only compact Habits block for the top of the Dashboard: the day's
// progress ring plus one tappable chip per habit, each with its own streak
// underneath. Tapping a chip logs or un-logs the habit for today, so the
// most common daily action never needs a trip to the Habits page.
function HabitChip({ habit, done, streak, todayKey }) {
  const { log, unlog } = useHabitLogMutations(habit.id);
  const color = paletteColorValue(habit.color);

  return (
    <div className="dashboard-habit-item">
      <button
        type="button"
        className={done ? 'dashboard-habit-chip done' : 'dashboard-habit-chip'}
        style={{ '--chip-color': color }}
        onClick={() => (done ? unlog.mutate(todayKey) : log.mutate(todayKey))}
        aria-pressed={done}
        aria-label={`${habit.name}: ${done ? 'done today, tap to undo' : 'not done today, tap to mark done'}. ${streak} day streak.`}
        title={habit.name}
      >
        <span className="dashboard-habit-chip-avatar">{habit.icon || habit.name.charAt(0).toUpperCase()}</span>
        {done && <span className="dashboard-habit-chip-check">✓</span>}
      </button>
      <span className={streak > 0 ? 'dashboard-habit-item-streak' : 'dashboard-habit-item-streak zero'}>
        🔥 {streak}
      </span>
    </div>
  );
}

export default function DashboardHabits({ habits, doneToday, streaks, todayKey, onOpen }) {
  const doneCount = habits.filter((h) => doneToday.has(h.id)).length;

  // The title sits beside the ring, above the chips, rather than on its
  // own row -- a whole line of vertical space on a phone for one word.
  return (
    <div className="card dashboard-habits-compact">
      <div className="dashboard-habits-compact-body">
        <ProgressRing
          value={doneCount}
          total={habits.length}
          size={68}
          strokeWidth={7}
          centerText={`${doneCount} of ${habits.length}`}
        />
        <div className="dashboard-habits-compact-right">
          <button type="button" className="dashboard-habits-compact-title" onClick={onOpen}>
            Habits <span aria-hidden="true">›</span>
          </button>
          {habits.length === 0 ? (
            <p className="text-muted dashboard-habits-compact-empty">No habits yet.</p>
          ) : (
            <div className="dashboard-habit-chips">
              {habits.map((habit) => (
                <HabitChip
                  key={habit.id}
                  habit={habit}
                  done={doneToday.has(habit.id)}
                  streak={streaks[habit.id] ?? 0}
                  todayKey={todayKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
