import { useEffect, useRef, useState } from 'react';
import { SCHEDULE_HOURS, formatHourLabel, parseDateKey } from '../../lib/dateUtils.js';
import { useDebouncedActions } from '../../lib/useDebouncedActions.js';
import { useSchedule, useSetScheduleHour } from './usePlannerData.js';
import './ScheduleGrid.css';

const SAVE_DELAY_MS = 500;
const HOUR_MS = 60 * 60 * 1000;
const FIRST_HOUR = SCHEDULE_HOURS[0];
const LAST_HOUR = SCHEDULE_HOURS[SCHEDULE_HOURS.length - 1];

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

  // The typed schedule covers 6am-10pm. Calendar events outside that
  // stretch the grid for the day (display-only rows -- the schedule table
  // only stores 6..22), rather than being silently dropped.
  const dayStart = parseDateKey(dateKey);
  const hourOf = (date) => Math.floor((date - dayStart) / HOUR_MS);
  let firstHour = FIRST_HOUR;
  let lastHour = LAST_HOUR;
  for (const event of googleEvents) {
    firstHour = Math.min(firstHour, Math.max(0, hourOf(event.start)));
    lastHour = Math.max(lastHour, Math.min(23, hourOf(new Date(event.end - 1))));
  }
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);

  return (
    <div className="schedule-grid">
      {hours.map((hour) => {
        const hourStart = new Date(dayStart.getTime() + hour * HOUR_MS);
        const hourEnd = new Date(hourStart.getTime() + HOUR_MS);
        // Every event overlapping this hour: the one that starts here gets
        // the full chip, ones still running get a quieter continuation.
        const overlapping = googleEvents.filter((e) => e.start < hourEnd && e.end > hourStart);
        const editable = hour >= FIRST_HOUR && hour <= LAST_HOUR;
        return (
          <div className={editable ? 'schedule-row' : 'schedule-row schedule-row--extra'} key={hour}>
            <div className="schedule-hour">{formatHourLabel(hour)}</div>
            <div className="schedule-row-content">
              {overlapping.map((event) => {
                const startsHere = event.start >= hourStart;
                return startsHere ? (
                  <div key={event.id} className="schedule-gcal-chip" title={event.title}>
                    <span className="schedule-gcal-time">
                      {formatEventTime(event.start)}–{formatEventTime(event.end)}
                    </span>{' '}
                    {event.title}
                  </div>
                ) : (
                  <div key={event.id} className="schedule-gcal-chip schedule-gcal-chip--continues" title={event.title}>
                    ↳ {event.title}
                  </div>
                );
              })}
              {editable && (
                <input
                  className="schedule-input"
                  type="text"
                  value={localValues[hour] || ''}
                  onChange={(e) => handleChange(hour, e.target.value)}
                  placeholder="—"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
