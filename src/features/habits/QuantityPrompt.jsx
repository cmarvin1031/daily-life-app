import { useEffect, useState } from 'react';
import { formatDisplayDate, parseDateKey } from '../../lib/dateUtils.js';
import { formatTarget } from './habitProgress.js';
import './QuantityPrompt.css';

// Small modal for entering a quantity habit's amount for one day. Used from
// the Habits row, the month calendar and the Dashboard chip.
// `value` is the day's current log (undefined = none, null = old plain check).
export default function QuantityPrompt({ habit, dateKey, value, onSave, onClose }) {
  const [text, setText] = useState(typeof value === 'number' ? String(value) : '');
  const target = Number(habit.target_value);
  const hasLog = value !== undefined;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function commit(n) {
    onSave(n);
    onClose();
  }

  function submit(e) {
    e.preventDefault();
    const n = Number(text);
    if (text.trim() === '' || Number.isNaN(n) || n < 0) return;
    commit(n);
  }

  return (
    <div className="qty-overlay" onClick={onClose}>
      <form className="card qty-panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="qty-title">
          {habit.icon ? `${habit.icon} ` : ''}
          {habit.name}
        </div>
        <div className="text-muted qty-date">{formatDisplayDate(parseDateKey(dateKey))}</div>

        <div className="qty-input-row">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="0"
            aria-label={`Amount${habit.unit ? ` (${habit.unit})` : ''}`}
          />
          <span className="text-muted qty-target">/ {formatTarget(habit)}</span>
        </div>

        <div className="qty-actions">
          {hasLog && (
            <button type="button" className="btn btn-secondary" onClick={() => commit(0)}>
              Clear
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => commit(target)}>
            Mark {formatTarget(habit)}
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
