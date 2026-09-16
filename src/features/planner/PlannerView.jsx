import { useState } from 'react';
import { toDateKey, toWeekKey, toMonthKey } from '../../lib/dateUtils.js';
import DateNav from '../../components/DateNav.jsx';
import { useDayInit } from './usePlannerData.js';
import { useCalendarEvents } from '../calendar/useCalendarData.js';
import AllDayEvents from './AllDayEvents.jsx';
import ScheduleGrid from './ScheduleGrid.jsx';
import TodoList from './TodoList.jsx';
import PrioritiesPanel from './PrioritiesPanel.jsx';
import './PlannerView.css';

export default function PlannerView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateKey = toDateKey(currentDate);
  const weekKey = toWeekKey(currentDate);
  const monthKey = toMonthKey(currentDate);

  const dayInit = useDayInit(dateKey);
  const dayReady = dayInit.isSuccess;

  const { data: calendarEvents } = useCalendarEvents(dateKey);

  return (
    <div className="planner-view">
      <DateNav currentDate={currentDate} onChange={setCurrentDate} />

      <AllDayEvents events={calendarEvents?.allDay} />

      <div className="planner-grid">
        <div className="card planner-schedule-card">
          <h3>Schedule</h3>
          {/* Keyed by date so each day gets a fresh grid: switching days
              unmounts the old one, which flushes any unsaved typing to the
              day it belonged to. */}
          <ScheduleGrid key={dateKey} dateKey={dateKey} enabled={dayReady} googleEvents={calendarEvents?.timed || []} />
        </div>

        <div className="planner-side">
          <TodoList dateKey={dateKey} enabled={dayReady} />
          <PrioritiesPanel weekKey={weekKey} monthKey={monthKey} enabled={dayReady} />
        </div>
      </div>
    </div>
  );
}
