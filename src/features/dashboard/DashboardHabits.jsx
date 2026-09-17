import { useState } from 'react';
import ProgressRing from '../habits/ProgressRing.jsx';
import QuantityPrompt from '../habits/QuantityPrompt.jsx';
import { useHabitLogMutations } from '../habits/useHabitsData.js';
import { isLogDone, isQuantityHabit } from '../habits/habitProgress.js';
import { paletteColorValue } from '../../lib/colorPalette.js';

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

// Phone-only compact Habits block for the top of the Dashboard: the day's
// progress ring plus one tappable chip per habit, each with its own streak
// underneath. Tapping a chip logs or un-logs a plain habit for today;
// quantity habits ask for the amount and show a partial ring until the
// target is reached.
function HabitChip({ habit, value, streak, todayKey, onOpenPrompt }) {
  const { log, unlog } = useHabitLogMutations(habit.id);
  const color = paletteColorValue(habit.color);
  const quantity = isQuantityHabit(habit);
  const done = isLogDone(habit, value);
  const amount = typeof value === 'number' ? value : 0;
  const target = Number(habit.target_value) || 0;
  const partial = quantity && !done && amount > 0;
  const fraction = quantity && target > 0 ? Math.min(amount / target, 1) : 0;

  function handleClick() {
    if (quantity) onOpenPrompt(habit);
    else if (done) unlog.mutate(todayKey);
    else log.mutate(todayKey);
  }

  const label = quantity
    ? `${habit.name}: ${amount} of ${target}${habit.unit ? ` ${habit.unit}` : ''} today, tap to log`
    : `${habit.name}: ${done ? 'done today, tap to undo' : 'not done today, tap to mark done'}. ${streak} day streak.`;

  return (
    <div className="dashboard-habit-item">
      <button
        type="button"
        className={`dashboard-habit-chip${done ? ' done' : ''}${quantity && !done ? ' quantity' : ''}`}
        style={{ '--chip-color': color }}
        onClick={handleClick}
        aria-pressed={done}
        aria-label={label}
        title={habit.name}
      >
        {quantity && !done && (
          <svg className="dashboard-habit-ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle className="dashboard-habit-ring-track" cx="22" cy="22" r={RING_R} />
            <circle
              className="dashboard-habit-ring-fill"
              cx="22"
              cy="22"
              r={RING_R}
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - fraction)}
            />
          </svg>
        )}
        <span className="dashboard-habit-chip-avatar">{habit.icon || habit.name.charAt(0).toUpperCase()}</span>
        {done && <span className="dashboard-habit-chip-check">✓</span>}
      </button>
      {partial ? (
        <span className="dashboard-habit-item-streak">
          {amount}/{target}
        </span>
      ) : (
        <span className={streak > 0 ? 'dashboard-habit-item-streak' : 'dashboard-habit-item-streak zero'}>
          🔥 {streak}
        </span>
      )}
    </div>
  );
}

// Own component so the prompt's mutation hook is bound to the habit it's
// editing.
function ChipPrompt({ habit, todayKey, value, onClose }) {
  const { setValue } = useHabitLogMutations(habit.id);
  return (
    <QuantityPrompt
      habit={habit}
      dateKey={todayKey}
      value={value}
      onSave={(v) => setValue.mutate({ dateKey: todayKey, value: v })}
      onClose={onClose}
    />
  );
}

export default function DashboardHabits({ habits, todayLogs, streaks, todayKey, onOpen }) {
  const [promptHabit, setPromptHabit] = useState(null);
  const doneCount = habits.filter((h) => isLogDone(h, todayLogs[h.id])).length;

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
                  value={todayLogs[habit.id]}
                  streak={streaks[habit.id] ?? 0}
                  todayKey={todayKey}
                  onOpenPrompt={setPromptHabit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {promptHabit && (
        <ChipPrompt
          key={promptHabit.id}
          habit={promptHabit}
          todayKey={todayKey}
          value={todayLogs[promptHabit.id]}
          onClose={() => setPromptHabit(null)}
        />
      )}
    </div>
  );
}
