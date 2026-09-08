import { useEffect, useRef, useState } from 'react';
import { SCHEDULE_HOURS, formatHourLabel } from '../../lib/dateUtils.js';
import { useSchedule, useSetScheduleHour } from './usePlannerData.js';
import './ScheduleGrid.css';

const SAVE_DELAY_MS = 500;

function formatEventTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ScheduleGrid({ dateKey, enabled, googleEvents = [] }) {
  const { data: schedule } = useSchedule(dateKey, enabled);
  const setHour = useSetScheduleHour(dateKey);

  const [localValues, setLocalValues] = useState({});
  const loadedDateRef = useRef(null);
  const timersRef = useRef({});

  useEffect(() => {
    if (schedule && loadedDateRef.current !== dateKey) {
      setLocalValues(schedule);
      loadedDateRef.current = dateKey;
    }
  }, [schedule, dateKey]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  function handleChange(hour, text) {
    setLocalValues((prev) => ({ ...prev, [hour]: text }));
    clearTimeout(timersRef.current[hour]);
    timersRef.current[hour] = setTimeout(() => {
      setHour.mutate({ hour, text });
    }, SAVE_DELAY_MS);
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
