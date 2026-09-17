import { useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';
import { useHabitLog, useHabitLogMutations } from './useHabitsData.js';
import { computeStreak, getLast7Days } from './streak.js';
import { doneDateKeys, formatTarget, isLogDone, isQuantityHabit } from './habitProgress.js';
import { PALETTE_COLORS, paletteColorValue } from '../../lib/colorPalette.js';
import MonthGrid from './MonthGrid.jsx';
import QuantityPrompt from './QuantityPrompt.jsx';

const HABIT_ICONS = ['🏃', '💧', '📚', '🧘', '😴', '🍎', '💊', '🪥', '💪', '🧹', '💰', '🙏', '📝', '🎨', '🎸', '🌱'];

export default function HabitRow({ habit, todayKey, onArchive, onRename, onColorChange, onIconChange, onTargetChange }) {
  const { data: logs = [] } = useHabitLog(habit.id);
  const { log, unlog, setValue } = useHabitLogMutations(habit.id);

  const quantity = isQuantityHabit(habit);
  const valueByDate = Object.fromEntries(logs.map((l) => [l.date, l.value]));
  const todayValue = valueByDate[todayKey];
  const doneToday = isLogDone(habit, todayValue);
  const partialToday = quantity && !doneToday && typeof todayValue === 'number' && todayValue > 0;
  const doneKeys = doneDateKeys(habit, logs);
  const streak = computeStreak(doneKeys);
  const last7 = getLast7Days(doneKeys);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameValue, setNameValue] = useState(habit.name);
  const [iconValue, setIconValue] = useState(habit.icon || '');
  const [targetValue, setTargetValue] = useState(habit.target_value ?? '');
  const [unitValue, setUnitValue] = useState(habit.unit || '');
  const [promptDate, setPromptDate] = useState(null);

  const color = paletteColorValue(habit.color);

  // Tapping the check / a calendar day: plain habits toggle, quantity
  // habits ask for the amount.
  function selectDate(dateKey) {
    if (quantity) {
      setPromptDate(dateKey);
      return;
    }
    if (valueByDate[dateKey] !== undefined) unlog.mutate(dateKey);
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

  function commitTarget() {
    const n = Number(targetValue);
    const target_value = String(targetValue).trim() !== '' && n > 0 ? n : null;
    const unit = unitValue.trim();
    if (target_value !== (habit.target_value ?? null) || unit !== (habit.unit || '')) {
      onTargetChange({ target_value, unit });
    }
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
      commitTarget();
      setEditOpen(false);
    } else {
      setNameValue(habit.name);
      setIconValue(habit.icon || '');
      setTargetValue(habit.target_value ?? '');
      setUnitValue(habit.unit || '');
      setEditOpen(true);
    }
  }

  const streakText = streak > 0 ? `${streak} day streak` : 'No streak yet';
  const subtitle = partialToday ? `${todayValue} of ${formatTarget(habit)} today · ${streakText}` : streakText;

  return (
    <div className="card habit-row">
      <div className="habit-row-main">
        <ExpandToggle expanded={historyOpen} onClick={toggleHistory} label="history" />

        <div className="habit-row-avatar" style={{ background: color }}>
          {habit.icon || habit.name.charAt(0).toUpperCase()}
        </div>

        <div className="habit-row-text">
          <span className={doneToday ? 'habit-row-name done' : 'habit-row-name'}>{habit.name}</span>
          <span className="text-muted habit-row-streak">{subtitle}</span>
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
          className={`habit-row-check${doneToday ? ' active' : ''}${partialToday ? ' partial' : ''}`}
          style={doneToday ? { background: color, borderColor: color } : partialToday ? { borderColor: color, color } : undefined}
          onClick={() => selectDate(todayKey)}
          aria-label={
            quantity
              ? `Log ${habit.unit || 'amount'} for today`
              : doneToday
                ? 'Mark not done today'
                : 'Mark done today'
          }
        >
          {doneToday ? '✓' : partialToday ? todayValue : ''}
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

              <div className="habit-details-row habit-target-row">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  className="habit-target-input"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  onBlur={commitTarget}
                  placeholder="Target"
                  aria-label="Daily target (leave blank for a simple check-off)"
                />
                <input
                  className="habit-unit-input"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  onBlur={commitTarget}
                  placeholder="unit, e.g. pages"
                  aria-label="Unit"
                />
                <span className="text-muted habit-target-hint">Leave the target blank for a simple check-off.</span>
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

          <MonthGrid habit={habit} valueByDate={valueByDate} onSelectDate={selectDate} />
        </div>
      )}

      {promptDate && (
        <QuantityPrompt
          habit={habit}
          dateKey={promptDate}
          value={valueByDate[promptDate]}
          onSave={(value) => setValue.mutate({ dateKey: promptDate, value })}
          onClose={() => setPromptDate(null)}
        />
      )}
    </div>
  );
}
