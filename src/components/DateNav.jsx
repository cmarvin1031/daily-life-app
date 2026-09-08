import { addDays, formatDisplayDate, toDateKey } from '../lib/dateUtils.js';
import './DateNav.css';

export default function DateNav({ currentDate, onChange }) {
  const isToday = toDateKey(currentDate) === toDateKey(new Date());

  return (
    <div className="date-nav">
      <button className="btn-icon" onClick={() => onChange(addDays(currentDate, -1))} aria-label="Previous day">
        ◀
      </button>
      <div className="date-nav-label">
        <h1>{formatDisplayDate(currentDate)}</h1>
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
