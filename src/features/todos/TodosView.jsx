import { useState } from 'react';
import { toDateKey, toWeekKey, toMonthKey } from '../../lib/dateUtils.js';
import DateNav from '../../components/DateNav.jsx';
import { useDayInit } from '../planner/usePlannerData.js';
import TodoList from '../planner/TodoList.jsx';
import PrioritiesPanel from '../planner/PrioritiesPanel.jsx';
import './TodosView.css';

// The day's to-dos plus the week's and month's priorities. Opening a day
// here (or on the Dashboard / Calendar) is what triggers its rollover.
export default function TodosView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateKey = toDateKey(currentDate);
  const weekKey = toWeekKey(currentDate);
  const monthKey = toMonthKey(currentDate);

  const dayInit = useDayInit(dateKey);
  const dayReady = dayInit.isSuccess;

  return (
    <div className="todos-view">
      <DateNav currentDate={currentDate} onChange={setCurrentDate} />
      <TodoList dateKey={dateKey} enabled={dayReady} />
      <PrioritiesPanel weekKey={weekKey} monthKey={monthKey} enabled={dayReady} />
    </div>
  );
}
