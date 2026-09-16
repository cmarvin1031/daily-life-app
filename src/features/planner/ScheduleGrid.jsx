import { useEffect, useRef, useState } from 'react';
import { SCHEDULE_HOURS, formatHourLabel } from '../../lib/dateUtils.js';
import { useDebouncedActions } from '../../lib/useDebouncedActions.js';
import { useSchedule, useSetScheduleHour } from './usePlannerData.js';
import './ScheduleGrid.css';

const SAVE_DELAY_MS = 500;

function formatEventTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Mounted once per date (the parent keys it by dateKey), so local state is
// always for exactly one day.
export default function ScheduleGrid({ dateKey, enabled, googleEvents = [] }) {
  const { data: schedule } = useSchedule(dateKey, enabled);
  const setHour = useSetScheduleHour();
  const { schedule: queueSave } = useDebouncedActions(SAVE_DELAY_MS);

  const [localValues, setLocalValues] = useState({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (schedule && !loadedRef.current) {
      // Anything typed before the fetch landed wins over the server copy.
      setLocalValues((typed) => ({ ...schedule, ...typed }));
      loadedRef.current = true;
    }
  }, [schedule]);

  function handleChange(hour, text) {
    setLocalValues((prev) => ({ ...prev, [hour]: text }));
    queueSave(hour, () => setHour.mutate({ dateKey, hour, text }));
  }

  return (
    <div className="schedule-grid">
      {SCHEDULE_HOURS.map((hour) => {
        const hourEvents = googleEvents.filter((e) => e.start.getHours() === hour);
        return (
          <div className="schedule-row" key={hour}>
            <div className="schedule-hour">{formatHourLabel(hour)}</div>
            <div className="schedule-row-content">
              {hourEvents.map((event) => (
                <div key={event.id} className="schedule-gcal-chip" title={event.title}>
                  <span className="schedule-gcal-time">{formatEventTime(event.start)}</span> {event.title}
                </div>
              ))}
              <input
                className="schedule-input"
                type="text"
                value={localValues[hour] || ''}
                onChange={(e) => handleChange(hour, e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
