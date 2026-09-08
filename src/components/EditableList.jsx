import { useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './EditableList.css';

export default function EditableList({
  items,
  onAdd,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  withCheckbox = false,
  withDueDate = false,
  onSetDueDate,
  addPlaceholder = 'Add...',
  emptyLabel = 'Nothing here yet.',
}) {
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function submitAdd(e) {
    e.preventDefault();
    if (!newValue.trim()) return;
    onAdd(newValue.trim());
    setNewValue('');
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditValue(item.text);
  }

  function commitEdit() {
    if (editValue.trim() && editValue.trim() !== items.find((i) => i.id === editingId)?.text) {
      onEdit(editingId, editValue.trim());
    }
    setEditingId(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  // Items are pre-sorted done-last by the query; mark where the completed
  // section begins so we can drop in a divider.
  const firstDoneIndex = withCheckbox ? items.findIndex((i) => i.done) : -1;

  return (
    <div className="editable-list">
      {items.length === 0 && <p className="text-muted editable-list-empty">{emptyLabel}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="editable-list-items">
            {items.map((item, index) => (
              <FragmentRow
                key={item.id}
                item={item}
                showDivider={withCheckbox && index === firstDoneIndex && firstDoneIndex > 0}
                withCheckbox={withCheckbox}
                withDueDate={withDueDate}
                onSetDueDate={onSetDueDate}
                editing={editingId === item.id}
                editValue={editValue}
                onToggle={onToggle}
                onStartEdit={() => startEdit(item)}
                onEditChange={setEditValue}
                onCommitEdit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form className="editable-list-add-form" onSubmit={submitAdd}>
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={addPlaceholder} />
        <button className="btn btn-secondary" type="submit">
          Add
        </button>
      </form>
    </div>
  );
}

function FragmentRow(props) {
  return (
    <>
      {props.showDivider && (
        <li className="editable-list-divider" aria-hidden="true">
          <span>Completed</span>
        </li>
      )}
      <Row {...props} />
    </>
  );
}

function Row({
  item,
  withCheckbox,
  withDueDate,
  onSetDueDate,
  editing,
  editValue,
  onToggle,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onDelete,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={item.done ? 'editable-list-item done' : 'editable-list-item'}>
      <button className="editable-list-handle" {...attributes} {...listeners} aria-label="Drag to reorder">
        ⠿
      </button>

      {withCheckbox && (
        <input type="checkbox" checked={!!item.done} onChange={(e) => onToggle(item.id, e.target.checked)} />
      )}

      {editing ? (
        <input
          className="editable-list-edit-input"
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
        />
      ) : (
        <span className="editable-list-text" onClick={onStartEdit}>
          {item.text}
        </span>
      )}

      {withDueDate && (
        <input
          type="date"
          className="editable-list-due-date"
          value={item.target_date || ''}
          onChange={(e) => onSetDueDate(item.id, e.target.value || null)}
        />
      )}

      <button className="editable-list-delete" onClick={onDelete} aria-label="Delete">
        ✕
      </button>
    </li>
  );
}
