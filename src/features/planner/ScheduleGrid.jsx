import { useEffect, useRef, useState } from 'react';
import { SCHEDULE_HOURS, formatHourLabel, parseDateKey, toDateKey } from '../../lib/dateUtils.js';
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

// Assigns overlapping events to side-by-side columns, Google Calendar
// style: events that overlap (transitively) form a cluster; within it each
// event takes the first column that's free when it starts, and every event
// in the cluster is drawn 1/N wide.
function layoutEvents(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let cluster = [];
  let clusterEnd = null;

  const flush = () => {
    const columnEnds = [];
    const placed = cluster.map((event) => {
      let col = columnEnds.findIndex((end) => end <= event.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(event.end);
      } else {
        columnEnds[col] = event.end;
      }
      return { event, col };
    });
    for (const p of placed) out.push({ ...p, cols: columnEnds.length });
    cluster = [];
    clusterEnd = null;
  };

  for (const event of sorted) {
    if (clusterEnd && event.start >= clusterEnd) flush();
    cluster.push(event);
    clusterEnd = clusterEnd && clusterEnd > event.end ? clusterEnd : event.end;
  }
  if (cluster.length) flush();
  return out;
}

// One day's timeline. Hour rows are a fixed height (--row-h, set in CSS);
// calendar events are absolutely positioned blocks in a lane beside the
// hour labels, sized by their real start/end; the typed schedule inputs sit
// to the right of the lane. Mounted once per date (parent keys by dateKey).
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

  // Keeps the "now" line moving while the tab stays open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function handleChange(hour, text) {
    setLocalValues((prev) => ({ ...prev, [hour]: text }));
    queueSave(hour, () => setHour.mutate({ dateKey, hour, text }));
  }

  // The typed schedule covers 6am-10pm. Events outside that stretch the
  // grid for the day (display-only rows -- the table only stores 6..22)
  // rather than being dropped.
  const dayStart = parseDateKey(dateKey);
  const hourOf = (date) => Math.floor((date - dayStart) / HOUR_MS);
  let firstHour = FIRST_HOUR;
  let lastHour = LAST_HOUR;
  for (const event of googleEvents) {
    firstHour = Math.min(firstHour, Math.max(0, hourOf(event.start)));
    lastHour = Math.max(lastHour, Math.min(23, hourOf(new Date(event.end - 1))));
  }
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const gridStart = new Date(dayStart.getTime() + firstHour * HOUR_MS);
  const gridEnd = new Date(dayStart.getTime() + (lastHour + 1) * HOUR_MS);
  const offsetHours = (date) => (Math.min(Math.max(date, gridStart), gridEnd) - gridStart) / HOUR_MS;

  const blocks = layoutEvents(googleEvents);

  const now = new Date();
  const showNow = toDateKey(now) === dateKey && now >= gridStart && now <= gridEnd;

  return (
    <div className={googleEvents.length > 0 ? 'schedule-grid has-events' : 'schedule-grid'}>
      <div className="schedule-hours">
        {hours.map((hour) => {
          const editable = hour >= FIRST_HOUR && hour <= LAST_HOUR;
          return (
            <div className={editable ? 'schedule-row' : 'schedule-row schedule-row--extra'} key={hour}>
              <div className="schedule-hour">{formatHourLabel(hour)}</div>
              <div className="schedule-row-content">
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

      {blocks.length > 0 && (
        <div className="schedule-events" aria-label="Calendar events">
          {blocks.map(({ event, col, cols }) => {
            const top = offsetHours(event.start);
            const height = Math.max(offsetHours(event.end) - top, 0.25);
            const compact = height < 0.75; // under 45 minutes: title only
            return (
              <div
                key={event.id}
                className={compact ? 'schedule-event schedule-event--compact' : 'schedule-event'}
                style={{
                  top: `calc(var(--row-h) * ${top})`,
                  height: `calc(var(--row-h) * ${height} - 2px)`,
                  left: `calc(${(col / cols) * 100}% + ${col === 0 ? 0 : 2}px)`,
                  width: `calc(${100 / cols}% - ${cols > 1 ? 2 : 0}px)`,
                }}
                title={`${event.title} · ${formatEventTime(event.start)}–${formatEventTime(event.end)}`}
              >
                <span className="schedule-event-title">{event.title}</span>
                {!compact && (
                  <span className="schedule-event-time">
                    {formatEventTime(event.start)} – {formatEventTime(event.end)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNow && (
        <div className="schedule-now" style={{ top: `calc(var(--row-h) * ${offsetHours(now)})` }} aria-hidden="true">
          <span className="schedule-now-dot" />
        </div>
      )}
    </div>
  );
}
