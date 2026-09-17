import { addDays, formatDisplayDate, toDateKey } from '../lib/dateUtils.js';
import './DateNav.css';

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DateNav({ currentDate, onChange }) {
  const isToday = toDateKey(currentDate) === toDateKey(new Date());

  return (
    <div className="date-nav">
      <button className="btn-icon" onClick={() => onChange(addDays(currentDate, -1))} aria-label="Previous day">
        ◀
      </button>
      <div className="date-nav-label">
        {/* Long form on desktop, "Thu, Sep 17" on phones -- the full form
            wraps to two big lines there and eats the first screen. */}
        <h1 className="date-nav-long">{formatDisplayDate(currentDate)}</h1>
        <h1 className="date-nav-short">{formatShortDate(currentDate)}</h1>
        {!isToday && (
          <button className="date-nav-today-btn" onClick={() => onChange(new Date())}>
            Jump to today
          </button>
        )}
      </div>
      <button className="btn-icon" onClick={() => onChange(addDays(currentDate, 1))} aria-label="Next day">
        ▶
      </button>
    </div>
  );
}
