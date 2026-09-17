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

// Assigns overlapping items to side-by-side columns, Google Calendar
// style: items that overlap (transitively) form a cluster; within it each
// takes the first column that's free when it starts, and every item in the
// cluster is drawn 1/N wide.
function layoutItems(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let cluster = [];
  let clusterEnd = null;

  const flush = () => {
    const columnEnds = [];
    const placed = cluster.map((item) => {
      let col = columnEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[col] = item.end;
      }
      return { item, col };
    });
    for (const p of placed) out.push({ ...p, cols: columnEnds.length });
    cluster = [];
    clusterEnd = null;
  };

  for (const item of sorted) {
    if (clusterEnd && item.start >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = clusterEnd && clusterEnd > item.end ? clusterEnd : item.end;
  }
  if (cluster.length) flush();
  return out;
}

// One day's timeline. Hour rows are a fixed height (--row-h, set in CSS).
// Calendar events and typed hourly notes are the same kind of thing here:
// blocks in one lane beside the hour labels, positioned by time and laid
// out side by side when they overlap. A typed note is a one-hour block you
// can edit in place; tapping an empty hour starts one. Mounted once per
// date (the parent keys it by dateKey).
export default function ScheduleGrid({ dateKey, enabled, googleEvents = [] }) {
  const { data: schedule } = useSchedule(dateKey, enabled);
  const setHour = useSetScheduleHour();
  const { schedule: queueSave } = useDebouncedActions(SAVE_DELAY_MS);

  const [localValues, setLocalValues] = useState({});
  const [editingHour, setEditingHour] = useState(null);
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
  const isEditable = (hour) => hour >= FIRST_HOUR && hour <= LAST_HOUR;

  const typedItems = hours
    .filter((hour) => isEditable(hour) && ((localValues[hour] || '').trim() !== '' || editingHour === hour))
    .map((hour) => ({
      id: `typed-${hour}`,
      kind: 'typed',
      hour,
      start: new Date(dayStart.getTime() + hour * HOUR_MS),
      end: new Date(dayStart.getTime() + (hour + 1) * HOUR_MS),
    }));
  const blocks = layoutItems([...googleEvents.map((e) => ({ ...e, kind: 'event' })), ...typedItems]);

  const now = new Date();
  const showNow = toDateKey(now) === dateKey && now >= gridStart && now <= gridEnd;

  return (
    <div className="schedule-grid">
      <div className="schedule-hours">
        {hours.map((hour) => (
          <div className={isEditable(hour) ? 'schedule-row' : 'schedule-row schedule-row--extra'} key={hour}>
            <div className="schedule-hour">{formatHourLabel(hour)}</div>
            {isEditable(hour) && (
              // Sits under the blocks: tapping empty space in an hour
              // starts a note there.
              <button
                type="button"
                className="schedule-slot"
                aria-label={`Add a note at ${formatHourLabel(hour)}`}
                onClick={() => setEditingHour(hour)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="schedule-lane">
        {blocks.map(({ item, col, cols }) => {
          const top = offsetHours(item.start);
          const height = Math.max(offsetHours(item.end) - top, 0.25);
          const style = {
            top: `calc(var(--row-h) * ${top})`,
            height: `calc(var(--row-h) * ${height} - 2px)`,
            left: `calc(${(col / cols) * 100}% + ${col === 0 ? 0 : 2}px)`,
            width: `calc(${100 / cols}% - ${cols > 1 ? 2 : 0}px)`,
          };

          if (item.kind === 'typed') {
            return (
              <input
                key={item.id}
                type="text"
                className="schedule-block schedule-block--typed"
                style={style}
                value={localValues[item.hour] || ''}
                autoFocus={editingHour === item.hour}
                placeholder="Note…"
                aria-label={`Note at ${formatHourLabel(item.hour)}`}
                onChange={(e) => handleChange(item.hour, e.target.value)}
                onFocus={() => setEditingHour(item.hour)}
                onBlur={() => {
                  if (editingHour === item.hour) setEditingHour(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
                }}
              />
            );
          }

          const compact = height < 0.75; // under 45 minutes: title only
          return (
            <div
              key={item.id}
              className={compact ? 'schedule-block schedule-block--compact' : 'schedule-block'}
              style={style}
              title={`${item.title} · ${formatEventTime(item.start)}–${formatEventTime(item.end)}`}
            >
              <span className="schedule-block-title">{item.title}</span>
              {!compact && (
                <span className="schedule-block-time">
                  {formatEventTime(item.start)} – {formatEventTime(item.end)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showNow && (
        <div className="schedule-now" style={{ top: `calc(var(--row-h) * ${offsetHours(now)})` }} aria-hidden="true">
          <span className="schedule-now-dot" />
        </div>
      )}
    </div>
  );
}
