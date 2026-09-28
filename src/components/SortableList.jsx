import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './SortableList.css';

// Vertical drag-to-reorder list for card-style items (habits, notebooks,
// pages). Only the grip handle starts a drag, so everything else in a card
// -- expand toggles, inputs, buttons -- keeps working normally.
//
//   <SortableList items={habits} onReorder={(ordered) => ...}
//     renderItem={(habit, dragHandle) => <HabitRow ... dragHandle={dragHandle} />} />
//
// Keyboard: Tab to a grip, Space to pick up, arrow keys to move, Space to
// drop, Esc to cancel.
export default function SortableList({ items, onReorder, renderItem, className, label = 'item' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} label={label}>
              {(dragHandle) => renderItem(item, dragHandle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, label, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  // Translate (not Transform): cards differ in height, and a scale would
  // squash them while dragging.
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="drag-handle"
      aria-label={`Drag to reorder ${label}`}
      {...attributes}
      {...listeners}
    >
      <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false">
        <circle cx="2.5" cy="2.5" r="1.5" />
        <circle cx="7.5" cy="2.5" r="1.5" />
        <circle cx="2.5" cy="8" r="1.5" />
        <circle cx="7.5" cy="8" r="1.5" />
        <circle cx="2.5" cy="13.5" r="1.5" />
        <circle cx="7.5" cy="13.5" r="1.5" />
      </svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'sortable-item dragging' : 'sortable-item'}>
      {children(dragHandle)}
    </div>
  );
}
