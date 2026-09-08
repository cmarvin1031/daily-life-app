import { useEffect, useRef, useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';
import EditableList from '../../components/EditableList.jsx';
import StatusPill from '../../components/StatusPill.jsx';
import { parseDateKey } from '../../lib/dateUtils.js';
import { useGoalMutations, useGoalTaskMutations, useGoalTasks } from './useGoalsData.js';
import './GoalCard.css';

const STATUSES = ['active', 'completed', 'archived'];
const CATEGORIES = ['personal', 'professional'];
const SAVE_DELAY_MS = 800;

export default function GoalCard({ goal, counts }) {
  const { update, remove } = useGoalMutations();

  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(goal.title);

  const isChecklist = goal.goal_type !== 'counter';
  const { data: tasks = [] } = useGoalTasks(goal.id, expanded && isChecklist);
  const taskMutations = useGoalTaskMutations(goal.id);

  const progress =
    goal.goal_type === 'counter'
      ? goal.counter_target
        ? `${goal.counter_current} of ${goal.counter_target} complete`
        : null
      : counts && counts.total > 0
        ? `${counts.done} of ${counts.total} tasks done`
        : null;

  function commitTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== goal.title) update.mutate({ id: goal.id, fields: { title: trimmed } });
  }

  function toggleExpanded() {
    setExpanded((v) => {
      const next = !v;
      if (!next) setEditOpen(false);
      return next;
    });
  }

  function toggleEdit() {
    if (editOpen) {
      commitTitle();
      setEditOpen(false);
    } else {
      setTitleValue(goal.title);
      setEditOpen(true);
    }
  }

  function handleAddTask(text) {
    const position = tasks.length ? Math.max(...tasks.map((t) => t.position)) + 1 : 0;
    taskMutations.add.mutate({ text, position });
  }

  function handleDelete() {
    if (window.confirm(`Permanently delete "${goal.title}" and all its tasks? This can't be undone.`)) {
      remove.mutate(goal.id);
    }
  }

  return (
    <div className="card goal-card">
      <div className="goal-card-main">
        <ExpandToggle expanded={expanded} onClick={toggleExpanded} label="goal details" />

        <div className="goal-card-text">
          <span className="goal-card-title">{goal.title}</span>
          {(progress || goal.target_date) && (
            <span className="text-muted goal-card-meta">
              {progress}
              {progress && goal.target_date && ' · '}
              {goal.target_date &&
                `Target: ${parseDateKey(goal.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
          )}
        </div>

        <StatusPill status={goal.status} />
      </div>

      {expanded && (
        <div className="goal-details">
          <div className="goal-details-top">
            <button
              className="goal-edit-btn"
              onClick={toggleEdit}
              aria-label={editOpen ? 'Done editing goal' : 'Edit goal'}
            >
              {editOpen ? '✓ Done' : '✎ Edit'}
            </button>
          </div>

          {editOpen && (
            <>
              <input
                className="goal-details-title-input"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitTitle();
                    setEditOpen(false);
                  }
                  if (e.key === 'Escape') {
                    setTitleValue(goal.title);
                    setEditOpen(false);
                  }
                }}
              />

              <div className="goal-details-status-row">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={goal.status === s ? 'goal-status-btn active' : 'goal-status-btn'}
                    onClick={() => update.mutate({ id: goal.id, fields: { status: s } })}
                  >
                    <StatusPill status={s} />
                  </button>
                ))}
              </div>

              <div className="goal-details-category-toggle">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={goal.category === c ? 'active' : ''}
                    onClick={() => update.mutate({ id: goal.id, fields: { category: c } })}
                  >
                    {c === 'personal' ? 'Personal' : 'Professional'}
                  </button>
                ))}
              </div>

              <label className="goal-details-field">
                <span className="text-muted">Target date</span>
                <input
                  type="date"
                  value={goal.target_date || ''}
                  onChange={(e) => update.mutate({ id: goal.id, fields: { target_date: e.target.value || null } })}
                />
              </label>

              <DescriptionField goalId={goal.id} initialValue={goal.description} update={update} />

              <button className="btn btn-secondary goal-delete-btn" onClick={handleDelete}>
                Delete goal
              </button>
            </>
          )}

          {goal.goal_type === 'counter' ? (
            <div className="goal-details-section">
              <h4>Progress</h4>
              <CounterProgress
                current={goal.counter_current}
                target={goal.counter_target}
                onSetCurrent={(value) => update.mutate({ id: goal.id, fields: { counter_current: value } })}
              />
            </div>
          ) : (
            <div className="goal-details-section">
              <h4>Tasks</h4>
              <EditableList
                items={tasks}
                withCheckbox
                withDueDate
                addPlaceholder="Add a task..."
                emptyLabel="No tasks yet."
                onAdd={handleAddTask}
                onToggle={(id, done) => taskMutations.update.mutate({ id, fields: { done } })}
                onEdit={(id, text) => taskMutations.update.mutate({ id, fields: { text } })}
                onSetDueDate={(id, target_date) => taskMutations.update.mutate({ id, fields: { target_date } })}
                onDelete={(id) => taskMutations.remove.mutate(id)}
                onReorder={(orderedItems) => taskMutations.reorder.mutate(orderedItems)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CounterProgress({ current, target, onSetCurrent }) {
  const pips = Array.from({ length: target }, (_, i) => i + 1);

  return (
    <div className="goal-counter">
      <div className="text-muted goal-counter-label">
        {current} of {target} complete
      </div>
      <div className="goal-counter-pips">
        {pips.map((n) => {
          const filled = n <= current;
          return (
            <button
              key={n}
              type="button"
              className={filled ? 'goal-counter-pip filled' : 'goal-counter-pip'}
              onClick={() => onSetCurrent(filled ? n - 1 : n)}
              aria-label={`Mark ${n} of ${target} complete`}
            />
          );
        })}
      </div>
    </div>
  );
}

function DescriptionField({ goalId, initialValue, update }) {
  const [value, setValue] = useState(initialValue || '');
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleChange(e) {
    const v = e.target.value;
    setValue(v);
    setStatus('pending');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus('saving');
      update.mutate(
        { id: goalId, fields: { description: v } },
        { onSuccess: () => setStatus('saved'), onError: () => setStatus('idle') },
      );
    }, SAVE_DELAY_MS);
  }

  return (
    <label className="goal-details-field">
      <div className="goal-details-field-label-row">
        <span className="text-muted">Description</span>
        <span className="text-muted goal-details-status">
          {status === 'pending' && 'Editing…'}
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
        </span>
      </div>
      <textarea
        className="goal-details-description"
        value={value}
        onChange={handleChange}
        placeholder="What does success look like?"
      />
    </label>
  );
}
