import { useState } from 'react';
import { useGoalMutations, useGoalTaskCounts, useGoals } from './useGoalsData.js';
import GoalCard from './GoalCard.jsx';
import './GoalsView.css';

const CATEGORIES = [
  { key: 'personal', label: 'Personal' },
  { key: 'professional', label: 'Professional' },
];

export default function GoalsView() {
  const [newGoal, setNewGoal] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [newType, setNewType] = useState('checklist');
  const [newTarget, setNewTarget] = useState('');
  const [showOthers, setShowOthers] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: activeGoals = [] } = useGoals(['active']);
  const { data: otherGoals = [] } = useGoals(['completed', 'archived'], { enabled: showOthers });
  const checklistGoalIds = activeGoals.filter((g) => g.goal_type !== 'counter').map((g) => g.id);
  const { data: taskCounts = {} } = useGoalTaskCounts(checklistGoalIds);
  const { add } = useGoalMutations();

  function handleAdd(e) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    if (newType === 'counter' && !(Number(newTarget) > 0)) return;
    const position = activeGoals.length ? Math.max(...activeGoals.map((g) => g.position)) + 1 : 0;
    add.mutate({
      title: newGoal.trim(),
      position,
      category: newCategory,
      goalType: newType,
      counterTarget: newType === 'counter' ? Number(newTarget) : null,
    });
    setNewGoal('');
    setNewTarget('');
  }

  return (
    <div className="goals-view">
      <div className="goals-header">
        <h1>Goals</h1>
        <button
          className="btn-icon"
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={showAddForm ? 'Close add goal form' : 'Add goal'}
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form className="card goals-add-bar" onSubmit={handleAdd}>
          <input autoFocus value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a new goal..." />

          <div className="goals-add-options">
            <div className="goals-add-toggle">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={newCategory === c.key ? 'active' : ''}
                  onClick={() => setNewCategory(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="goals-add-toggle">
              <button type="button" className={newType === 'checklist' ? 'active' : ''} onClick={() => setNewType('checklist')}>
                Checklist
              </button>
              <button type="button" className={newType === 'counter' ? 'active' : ''} onClick={() => setNewType('counter')}>
                Counter
              </button>
            </div>

            {newType === 'counter' && (
              <input
                type="number"
                min="1"
                className="goals-add-target"
                placeholder="Target #"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
              />
            )}

            <button className="btn btn-primary" type="submit">
              + Add Goal
            </button>
          </div>
        </form>
      )}

      {CATEGORIES.map((c) => {
        const goals = activeGoals.filter((g) => g.category === c.key);
        return (
          <section key={c.key} className="goals-section">
            <h2 className="goals-section-title">{c.label}</h2>
            {goals.length === 0 ? (
              <p className="text-muted goals-empty">No active {c.label.toLowerCase()} goals yet.</p>
            ) : (
              <div className="goals-list">
                {goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} counts={taskCounts[goal.id]} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <button className="goals-others-toggle" onClick={() => setShowOthers((v) => !v)}>
        {showOthers ? 'Hide completed & archived goals' : 'Show completed & archived goals'}
      </button>

      {showOthers && (
        <div className="goals-list">
          {otherGoals.length === 0 ? (
            <p className="text-muted goals-empty">Nothing here yet.</p>
          ) : (
            otherGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
          )}
        </div>
      )}
    </div>
  );
}
