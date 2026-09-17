import { useState } from 'react';
import { toDateKey } from '../../lib/dateUtils.js';
import DateNav from '../../components/DateNav.jsx';
import { useDayInit } from './usePlannerData.js';
import { useCalendarEvents } from '../calendar/useCalendarData.js';
import AllDayEvents from './AllDayEvents.jsx';
import ScheduleGrid from './ScheduleGrid.jsx';
import './PlannerView.css';

// The "Calendar" tab: one day at a time -- all-day events, then a timeline
// with Google Calendar events as blocks beside the typed hourly schedule.
// To-dos and priorities live on their own tab (features/todos).
export default function PlannerView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = toDateKey(currentDate);

  const dayInit = useDayInit(dateKey);
  const dayReady = dayInit.isSuccess;

  const { data: calendarEvents } = useCalendarEvents(dateKey);

  return (
    <div className="planner-view">
      <DateNav currentDate={currentDate} onChange={setCurrentDate} />

      <AllDayEvents events={calendarEvents?.allDay} />

      <div className="card planner-schedule-card">
        {/* Keyed by date so each day gets a fresh grid: switching days
            unmounts the old one, which flushes any unsaved typing to the
            day it belonged to. */}
        <ScheduleGrid key={dateKey} dateKey={dateKey} enabled={dayReady} googleEvents={calendarEvents?.timed || []} />
      </div>
    </div>
  );
}
