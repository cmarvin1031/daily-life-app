import { useState } from 'react';
import { toDateKey, daysInMonth, formatMonthLabel } from '../../lib/dateUtils.js';
import './MonthGrid.css';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// One month at a time, laid out as a standard Sunday-first calendar, with
// ‹ › to step back through history. Opens on the current month.
// loggedDates already holds the habit's full history, so paging needs no
// extra fetching.
export default function MonthGrid({ loggedDates, onToggleDate }) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const logged = new Set(loggedDates);
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const total = daysInMonth(view.year, view.month);
  const leadingBlanks = new Date(view.year, view.month, 1).getDay(); // 0 = Sunday

  function shiftMonth(delta) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="month-grid-block">
      <div className="month-grid-nav">
        <button type="button" className="month-grid-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="month-grid-label">{formatMonthLabel(new Date(view.year, view.month, 1))}</span>
        <button
          type="button"
          className="month-grid-nav-btn"
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="month-grid" role="grid">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="month-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} className="month-cell empty" aria-hidden="true" />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const dayNum = i + 1;
          const key = toDateKey(new Date(view.year, view.month, dayNum));
          const done = logged.has(key);
          const isFuture = key > todayKey;
          const isToday = key === todayKey;
          return (
            <button
              key={dayNum}
              type="button"
              className={`month-cell${done ? ' done' : ''}${isToday ? ' today' : ''}`}
              title={key}
              disabled={isFuture}
              onClick={() => onToggleDate(key, done)}
              aria-label={`${key}${done ? ', done' : ''}`}
              aria-pressed={done}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
