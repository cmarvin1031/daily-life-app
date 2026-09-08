export default function AllDayEvents({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="card planner-allday-card">
      <h3>All-Day Events</h3>
      <ul className="planner-allday-list">
        {events.map((event) => (
          <li key={event.id} className="planner-allday-item">
            {event.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
