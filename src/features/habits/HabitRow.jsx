import { useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';
import { useHabitLog, useHabitLogMutations } from './useHabitsData.js';
import { computeStreak, getLast7Days } from './streak.js';
import { PALETTE_COLORS, paletteColorValue } from '../../lib/colorPalette.js';
import MonthGrid from './MonthGrid.jsx';

const HABIT_ICONS = ['🏃', '💧', '📚', '🧘', '😴', '🍎', '💊', '🪥', '💪', '🧹', '💰', '🙏', '📝', '🎨', '🎸', '🌱'];

export default function HabitRow({ habit, todayKey, onArchive, onRename, onColorChange, onIconChange }) {
  const { data: loggedDates = [] } = useHabitLog(habit.id);
  const { log, unlog } = useHabitLogMutations(habit.id);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameValue, setNameValue] = useState(habit.name);
  const [iconValue, setIconValue] = useState(habit.icon || '');

  const color = paletteColorValue(habit.color);
  const doneToday = loggedDates.includes(todayKey);
  const streak = computeStreak(loggedDates);
  const last7 = getLast7Days(loggedDates);

  function handleToggleToday() {
    if (doneToday) unlog.mutate(todayKey);
    else log.mutate(todayKey);
  }

  function handleToggleDate(dateKey, currentlyDone) {
    if (currentlyDone) unlog.mutate(dateKey);
    else log.mutate(dateKey);
  }

  function commitName() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== habit.name) onRename(trimmed);
  }

  function commitIcon() {
    const trimmed = iconValue.trim();
    if (trimmed !== (habit.icon || '')) onIconChange(trimmed || null);
  }

  function toggleHistory() {
    setHistoryOpen((v) => {
      const next = !v;
      if (!next) setEditOpen(false);
      return next;
    });
  }

  function toggleEdit() {
    if (editOpen) {
      commitName();
      commitIcon();
      setEditOpen(false);
    } else {
      setNameValue(habit.name);
      setIconValue(habit.icon || '');
      setEditOpen(true);
    }
  }

  return (
    <div className="card habit-row">
      <div className="habit-row-main">
        <ExpandToggle expanded={historyOpen} onClick={toggleHistory} label="history" />

        <div className="habit-row-avatar" style={{ background: color }}>
          {habit.icon || habit.name.charAt(0).toUpperCase()}
        </div>

        <div className="habit-row-text">
          <span className={doneToday ? 'habit-row-name done' : 'habit-row-name'}>{habit.name}</span>
          <span className="text-muted habit-row-streak">
            {streak > 0 ? `${streak} day streak` : 'No streak yet'}
          </span>
        </div>

        <div className="habit-row-week" title="Last 7 days">
          {last7.map((day) => (
            <span
              key={day.key}
              className={day.done ? 'habit-row-week-dot done' : 'habit-row-week-dot'}
              style={day.done ? { background: color, borderColor: color } : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className={doneToday ? 'habit-row-check active' : 'habit-row-check'}
          style={doneToday ? { background: color, borderColor: color } : undefined}
          onClick={handleToggleToday}
          aria-label={doneToday ? 'Mark not done today' : 'Mark done today'}
        >
          {doneToday && '✓'}
        </button>
      </div>

      {historyOpen && (
        <div className="habit-details">
          <div className="habit-details-top">
            <button
              className="habit-edit-btn"
              onClick={toggleEdit}
              aria-label={editOpen ? 'Done editing habit' : 'Edit habit'}
            >
              {editOpen ? '✓ Done' : '✎ Edit'}
            </button>
          </div>

          {editOpen && (
            <>
              <div className="habit-details-row">
                <input
                  className="habit-icon-input"
                  maxLength={4}
                  value={iconValue}
                  onChange={(e) => setIconValue(e.target.value)}
                  onBlur={commitIcon}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder="🏃"
                  aria-label="Habit icon (emoji)"
                />
                <input
                  className="habit-details-name-input"
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitName();
                      setEditOpen(false);
                    }
                    if (e.key === 'Escape') {
                      setNameValue(habit.name);
                      setEditOpen(false);
                    }
                  }}
                />
                <button className="btn btn-secondary habit-archive-btn" onClick={onArchive}>
                  Archive
                </button>
              </div>

              <div className="habit-icon-picker">
                {HABIT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={emoji === habit.icon ? 'habit-icon-swatch active' : 'habit-icon-swatch'}
                    onClick={() => {
                      setIconValue(emoji);
                      onIconChange(emoji);
                    }}
                    aria-label={`Set icon to ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="habit-color-picker">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={c.key === habit.color ? 'habit-color-swatch active' : 'habit-color-swatch'}
                    style={{ background: c.value }}
                    onClick={() => onColorChange(c.key)}
                    aria-label={`Set color to ${c.key}`}
                  />
                ))}
              </div>
            </>
          )}

          <MonthGrid loggedDates={loggedDates} onToggleDate={handleToggleDate} />
        </div>
      )}
    </div>
  );
}
