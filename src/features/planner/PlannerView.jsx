import { useState } from 'react';
import { toDateKey, toWeekKey, toMonthKey } from '../../lib/dateUtils.js';
import DateNav from '../../components/DateNav.jsx';
import { useDayInit } from './usePlannerData.js';
import { useGoogleCalendarConnection } from '../../lib/useGoogleCalendarConnection.js';
import { useGoogleCalendarEvents, useGoogleCalendarList } from '../../lib/useGoogleCalendarData.js';
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

  const gcal = useGoogleCalendarConnection();
  const { data: calendarList } = useGoogleCalendarList(gcal.accessToken, gcal.handleExpired);
  const calendarIds = calendarList?.map((c) => c.id);
  const { data: gcalEvents } = useGoogleCalendarEvents(dateKey, gcal.accessToken, calendarIds, gcal.handleExpired);

  return (
    <div className="planner-view">
      <DateNav currentDate={currentDate} onChange={setCurrentDate} />

      <AllDayEvents events={gcalEvents?.allDay} />

      <div className="planner-grid">
        <div className="card planner-schedule-card">
          <h3>Schedule</h3>
          <ScheduleGrid dateKey={dateKey} enabled={dayReady} googleEvents={gcalEvents?.timed || []} />
        </div>

        <div className="planner-side">
          <TodoList dateKey={dateKey} enabled={dayReady} />
          <PrioritiesPanel weekKey={weekKey} monthKey={monthKey} enabled={dayReady} />
        </div>
      </div>
    </div>
  );
}
