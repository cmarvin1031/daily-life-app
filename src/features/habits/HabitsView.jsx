import { useState } from 'react';
import { toDateKey, formatDisplayDate } from '../../lib/dateUtils.js';
import { ListCard } from '../../components/ListCard.jsx';
import { useHabits, useHabitMutations, useTodayLoggedHabitIds } from './useHabitsData.js';
import HabitRow from './HabitRow.jsx';
import ProgressRing from './ProgressRing.jsx';
import './HabitsView.css';

export default function HabitsView() {
  const [newHabit, setNewHabit] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const todayKey = toDateKey(new Date());

  const { data: habits = [] } = useHabits(false);
  const { data: doneTodayIds = [] } = useTodayLoggedHabitIds(todayKey);
  const { data: archivedHabits = [] } = useHabits(true, { enabled: showArchived });
  const { add, update, archive, restore, remove } = useHabitMutations();

  const doneToday = new Set(doneTodayIds);
  const doneCount = habits.filter((h) => doneToday.has(h.id)).length;

  function handleAdd(e) {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const position = habits.length ? Math.max(...habits.map((h) => h.position)) + 1 : 0;
    add.mutate({ name: newHabit.trim(), position });
    setNewHabit('');
  }

  return (
    <div className="habits-view">
      <div className="habits-header">
        <h1>Habits</h1>
        <button
          className="btn-icon"
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={showAddForm ? 'Close add habit form' : 'Add habit'}
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form className="card habits-add-bar" onSubmit={handleAdd}>
          <input
            autoFocus
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Add a new habit..."
          />
          <button className="btn btn-primary" type="submit">
            + Add Habit
          </button>
        </form>
      )}

      {habits.length > 0 && (
        <div className="card habits-summary-card">
          <div>
            <div className="habits-summary-count">
              {doneCount} of {habits.length} done
            </div>
            <div className="text-muted habits-summary-date">{formatDisplayDate(new Date())}</div>
          </div>
          <ProgressRing value={doneCount} total={habits.length} />
        </div>
      )}

      {habits.length === 0 ? (
        <p className="text-muted habits-empty">No habits yet — add one above to get started.</p>
      ) : (
        <div className="habits-list">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              todayKey={todayKey}
              onArchive={() => archive.mutate(habit.id)}
              onRename={(name) => update.mutate({ id: habit.id, fields: { name } })}
              onColorChange={(color) => update.mutate({ id: habit.id, fields: { color } })}
              onIconChange={(icon) => update.mutate({ id: habit.id, fields: { icon } })}
            />
          ))}
        </div>
      )}

      <button className="habits-archived-toggle" onClick={() => setShowArchived((v) => !v)}>
        {showArchived ? 'Hide archived habits' : 'Show archived habits'}
      </button>

      {showArchived && (
        <ListCard title="Archived" empty="No archived habits.">
          {archivedHabits.length > 0 && (
            <ul className="archived-habit-list">
              {archivedHabits.map((habit) => (
                <li key={habit.id} className="archived-habit-row">
                  <span className="archived-habit-name">{habit.name}</span>
                  <div className="archived-habit-actions">
                    <button className="btn btn-secondary habit-restore-btn" onClick={() => restore.mutate(habit.id)}>
                      Restore
                    </button>
                    <button
                      className="habit-delete-btn"
                      aria-label="Delete permanently"
                      onClick={() => {
                        if (window.confirm(`Permanently delete "${habit.name}" and all its history? This can't be undone.`)) {
                          remove.mutate(habit.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ListCard>
      )}
    </div>
  );
}
