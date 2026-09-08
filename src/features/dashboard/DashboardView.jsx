import { formatHourLabel, parseDateKey, toDateKey, toMonthKey, toWeekKey } from '../../lib/dateUtils.js';
import { ListCard, ListRow } from '../../components/ListCard.jsx';
import StatusPill from '../../components/StatusPill.jsx';
import { useSchedule, useTodos, usePriorities } from '../planner/usePlannerData.js';
import { useGoogleCalendarConnection } from '../../lib/useGoogleCalendarConnection.js';
import { useGoogleCalendarEvents, useGoogleCalendarList } from '../../lib/useGoogleCalendarData.js';
import { useAllHabitLogs, useHabits, useTodayLoggedHabitIds } from '../habits/useHabitsData.js';
import { computeStreak, getLast7Days } from '../habits/streak.js';
import ProgressRing from '../habits/ProgressRing.jsx';
import { paletteColorValue } from '../../lib/colorPalette.js';
import { useGoalTaskCounts, useGoals } from '../goals/useGoalsData.js';
import GoalProgressMini from './GoalProgressMini.jsx';
import './DashboardView.css';

export default function DashboardView({ onNavigate }) {
  const now = new Date();
  const todayKey = toDateKey(now);
  const weekKey = toWeekKey(now);
  const monthKey = toMonthKey(now);

  // Planner: to-dos + priorities
  const { data: todos = [] } = useTodos(todayKey, true);
  const todosRemaining = todos.filter((t) => !t.done);
  const { data: weekPriorities = [] } = usePriorities('week', weekKey, true);
  const { data: monthPriorities = [] } = usePriorities('month', monthKey, true);

  // Google Calendar: remaining events today
  const gcal = useGoogleCalendarConnection();
  const { data: calendarList } = useGoogleCalendarList(gcal.accessToken, gcal.handleExpired);
  const calendarIds = calendarList?.map((c) => c.id);
  const { data: gcalEvents } = useGoogleCalendarEvents(todayKey, gcal.accessToken, calendarIds, gcal.handleExpired);
  const remainingTimedEvents = (gcalEvents?.timed || []).filter((e) => e.end > now);
  const allDayEvents = gcalEvents?.allDay || [];

  // Planner: today's manually-typed schedule entries, remaining hours only
  const { data: schedule = {} } = useSchedule(todayKey, true);
  const currentHour = now.getHours();
  const scheduleItems = Object.entries(schedule)
    .filter(([hour, text]) => text.trim() && Number(hour) >= currentHour)
    .map(([hour, text]) => ({
      id: `schedule-${hour}`,
      title: text,
      time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hour), 0, 0),
      subtitle: formatHourLabel(Number(hour)),
      source: 'planner',
    }));

  const gcalTimedItems = remainingTimedEvents.map((event) => ({
    id: event.id,
    title: event.title,
    time: event.start,
    subtitle: event.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    source: 'gcal',
  }));

  const timedItems = [...gcalTimedItems, ...scheduleItems].sort((a, b) => a.time - b.time);

  // Habits
  const { data: habits = [] } = useHabits(false);
  const { data: doneTodayIds = [] } = useTodayLoggedHabitIds(todayKey);
  const { data: logsByHabit = {} } = useAllHabitLogs();
  const doneToday = new Set(doneTodayIds);
  const habitsDoneToday = habits.filter((h) => doneToday.has(h.id)).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, computeStreak(logsByHabit[h.id] || [])), 0);

  // Goals
  const { data: activeGoals = [] } = useGoals(['active']);
  const checklistGoalIds = activeGoals.filter((g) => g.goal_type !== 'counter').map((g) => g.id);
  const { data: taskCounts = {} } = useGoalTaskCounts(checklistGoalIds);

  return (
    <div className="dashboard-view">
      <h1>Dashboard</h1>
      <p className="text-muted dashboard-subtitle">Plan, prioritize, and accomplish your day with ease.</p>

      <div className="dashboard-grid">
        <div className="dashboard-col">
          <ListCard title="Today's Events" empty="Nothing left today.">
            {(allDayEvents.length > 0 || timedItems.length > 0) && (
              <div className="dashboard-events-list">
                {allDayEvents.map((event) => (
                  <div key={event.id} className="dashboard-event-row">
                    <span className="text-muted dashboard-event-time">All day</span>
                    <span className="dashboard-event-dot allday" />
                    <span className="dashboard-event-title">{event.title}</span>
                  </div>
                ))}
                {timedItems.map((item) => (
                  <div
                    key={item.id}
                    className={item.source === 'planner' ? 'dashboard-event-row clickable' : 'dashboard-event-row'}
                    onClick={item.source === 'planner' ? () => onNavigate('planner') : undefined}
                  >
                    <span className="text-muted dashboard-event-time">{item.subtitle}</span>
                    <span className={`dashboard-event-dot ${item.source}`} />
                    <span className="dashboard-event-title">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </ListCard>

          <ListCard title="To-Do" empty="Nothing left today 🎉">
            {todosRemaining.length > 0 &&
              todosRemaining.map((todo) => (
                <ListRow key={todo.id} title={todo.text} onClick={() => onNavigate('planner')} />
              ))}
          </ListCard>

          <div className="card dashboard-priorities-card">
            <h3>Priorities</h3>
            <div className="dashboard-priorities-section">
              <span className="text-muted dashboard-priorities-label">This Week</span>
              {weekPriorities.length === 0 ? (
                <p className="text-muted dashboard-priorities-empty">Nothing yet.</p>
              ) : (
                <div className="dashboard-priorities-list">
                  {weekPriorities.map((p) => (
                    <div key={p.id} className="dashboard-priority-row">
                      <span className="dashboard-priority-chip week">📌</span>
                      <span className="dashboard-priority-text">{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dashboard-priorities-section">
              <span className="text-muted dashboard-priorities-label">This Month</span>
              {monthPriorities.length === 0 ? (
                <p className="text-muted dashboard-priorities-empty">Nothing yet.</p>
              ) : (
                <div className="dashboard-priorities-list">
                  {monthPriorities.map((p) => (
                    <div key={p.id} className="dashboard-priority-row">
                      <span className="dashboard-priority-chip month">📌</span>
                      <span className="dashboard-priority-text">{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-col">
          <div className="card dashboard-habits-card">
            <div className="dashboard-card-header">
              <h3>Habits</h3>
              {longestStreak > 0 && <span className="text-muted dashboard-card-header-stat">🔥 {longestStreak} day streak</span>}
            </div>
            <div className="dashboard-habits-top">
              <ProgressRing value={habitsDoneToday} total={habits.length} size={84} strokeWidth={8} />
              <div className="dashboard-habits-top-text">
                <span className="dashboard-habits-count">
                  {habitsDoneToday} of {habits.length}
                </span>
                <span className="text-muted">habits done today</span>
              </div>
            </div>

            {habits.length === 0 ? (
              <p className="text-muted">No habits yet.</p>
            ) : (
              <div className="dashboard-habits-list">
                {habits.map((habit) => {
                  const loggedDates = logsByHabit[habit.id] || [];
                  const last7 = getLast7Days(loggedDates);
                  const streak = computeStreak(loggedDates);
                  const color = paletteColorValue(habit.color);
                  const isDoneToday = doneToday.has(habit.id);
                  return (
                    <div key={habit.id} className="dashboard-habit-row" onClick={() => onNavigate('habits')}>
                      <div className="dashboard-habit-row-avatar" style={{ background: color }}>
                        {habit.icon || habit.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="dashboard-habit-row-text">
                        <span className={isDoneToday ? 'dashboard-habit-row-name done' : 'dashboard-habit-row-name'}>
                          {habit.name}
                        </span>
                        <span className="text-muted dashboard-habit-row-streak">
                          {streak > 0 ? `${streak} day streak` : 'No streak yet'}
                        </span>
                      </div>
                      <div className="dashboard-habit-row-week" title="Last 7 days">
                        {last7.map((day) => (
                          <span
                            key={day.key}
                            className={day.done ? 'dashboard-habit-week-dot done' : 'dashboard-habit-week-dot'}
                            style={day.done ? { background: color, borderColor: color } : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ListCard
            title="Goals"
            action={<span className="text-muted dashboard-card-header-stat">{activeGoals.length} active</span>}
            empty="No active goals yet."
          >
            {activeGoals.length > 0 && (
              <div className="dashboard-goals-list">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="dashboard-goal-row" onClick={() => onNavigate('goals')}>
                    <span className={`dashboard-goal-icon ${goal.category}`}>
                      {goal.category === 'professional' ? '💼' : '🎯'}
                    </span>
                    <div className="dashboard-goal-row-body">
                      <div className="dashboard-goal-row-top">
                        <span className="dashboard-goal-row-title">{goal.title}</span>
                        <StatusPill status={goal.status} />
                      </div>
                      <GoalProgressMini goal={goal} counts={taskCounts[goal.id]} />
                      {goal.target_date && (
                        <span className="text-muted dashboard-goal-row-date">
                          Due {parseDateKey(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ListCard>
        </div>
      </div>
    </div>
  );
}
