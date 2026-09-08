export default function GoalProgressMini({ goal, counts }) {
  if (goal.goal_type === 'counter') {
    const target = goal.counter_target || 0;
    const current = goal.counter_current || 0;
    if (target === 0) return null;
    const pips = Array.from({ length: target }, (_, i) => i + 1);

    return (
      <div className="goal-progress-mini">
        <div className="goal-progress-mini-pips">
          {pips.map((n) => (
            <span key={n} className={n <= current ? 'goal-progress-mini-pip filled' : 'goal-progress-mini-pip'} />
          ))}
        </div>
        <span className="text-muted goal-progress-mini-label">
          {current} of {target}
        </span>
      </div>
    );
  }

  const total = counts?.total || 0;
  const done = counts?.done || 0;
  if (total === 0) return null;
  const percent = Math.round((done / total) * 100);

  return (
    <div className="goal-progress-mini">
      <div className="goal-progress-mini-bar-track">
        <div className="goal-progress-mini-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-muted goal-progress-mini-label">
        {done} of {total}
      </span>
    </div>
  );
}
