import { useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';
import EditableList from '../../components/EditableList.jsx';
import StatusPill from '../../components/StatusPill.jsx';
import { parseDateKey } from '../../lib/dateUtils.js';
import { useDebouncedActions } from '../../lib/useDebouncedActions.js';
import { useGoalEntries, useGoalEntryMutations, useGoalMutations, useGoalTaskMutations, useGoalTasks } from './useGoalsData.js';
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

              {goal.goal_type === 'counter' && (
                <label className="goal-details-field">
                  <span className="text-muted">Target count</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    className="goal-details-target-input"
                    defaultValue={goal.counter_target || ''}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (n > 0 && n !== goal.counter_target) update.mutate({ id: goal.id, fields: { counter_target: n } });
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                </label>
              )}

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
              <CounterProgress goal={goal} />
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

// Pips summarise progress; the list beneath is what each one *is* -- a book
// title, a date. Adding with an empty label still counts (an untitled pip).
function CounterProgress({ goal }) {
  const { data: entries = [] } = useGoalEntries(goal.id);
  const entryMutations = useGoalEntryMutations(goal.id);
  const [label, setLabel] = useState('');

  const target = goal.counter_target || 0;
  const current = goal.counter_current || 0;
  const pips = Array.from({ length: target }, (_, i) => i + 1);

  function submit(e) {
    e.preventDefault();
    entryMutations.add.mutate({ label });
    setLabel('');
  }

  return (
    <div className="goal-counter">
      <div className="text-muted goal-counter-label">
        {current} of {target} complete
      </div>
      <div className="goal-counter-pips" aria-hidden="true">
        {pips.map((n) => (
          <span key={n} className={n <= current ? 'goal-counter-pip filled' : 'goal-counter-pip'} />
        ))}
      </div>

      {entries.length > 0 && (
        <ul className="goal-entries">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onRename={(text) => entryMutations.update.mutate({ id: entry.id, fields: { label: text } })}
              onDelete={() => entryMutations.remove.mutate(entry.id)}
            />
          ))}
        </ul>
      )}

      <form className="goal-entry-add" onSubmit={submit}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What did you finish? (optional)"
          aria-label="Entry label"
        />
        <button className="btn btn-secondary" type="submit" disabled={current >= target && target > 0}>
          + Add
        </button>
      </form>
    </div>
  );
}

function EntryRow({ entry, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.label);

  function commit() {
    const trimmed = text.trim();
    if (trimmed !== entry.label) onRename(trimmed);
    setEditing(false);
  }

  const date = parseDateKey(entry.entry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <li className="goal-entry">
      <span className="goal-entry-dot" aria-hidden="true" />
      {editing ? (
        <input
          className="goal-entry-input"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setText(entry.label);
              setEditing(false);
            }
          }}
          placeholder="Untitled"
        />
      ) : (
        <button
          type="button"
          className={entry.label ? 'goal-entry-label' : 'goal-entry-label untitled'}
          onClick={() => {
            setText(entry.label);
            setEditing(true);
          }}
          title="Tap to rename"
        >
          {entry.label || 'Untitled'}
        </button>
      )}
      <span className="text-muted goal-entry-date">{date}</span>
      <button type="button" className="goal-entry-delete" onClick={onDelete} aria-label="Remove entry">
        ✕
      </button>
    </li>
  );
}

function DescriptionField({ goalId, initialValue, update }) {
  const [value, setValue] = useState(initialValue || '');
  const [status, setStatus] = useState('idle');
  // Flushes (not drops) a pending save if the card is collapsed mid-typing.
  const { schedule: queueSave } = useDebouncedActions(SAVE_DELAY_MS);

  function handleChange(e) {
    const v = e.target.value;
    setValue(v);
    setStatus('pending');
    queueSave('description', () => {
      setStatus('saving');
      update.mutate(
        { id: goalId, fields: { description: v } },
        { onSuccess: () => setStatus('saved'), onError: () => setStatus('idle') },
      );
    });
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
