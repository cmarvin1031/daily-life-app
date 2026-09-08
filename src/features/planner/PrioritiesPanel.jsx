import { ListCard } from '../../components/ListCard.jsx';
import EditableList from '../../components/EditableList.jsx';
import { usePriorities, usePriorityMutations } from './usePlannerData.js';

function PriorityListCard({ title, scope, periodKey, enabled }) {
  const { data: items = [] } = usePriorities(scope, periodKey, enabled);
  const { add, update, remove, reorder } = usePriorityMutations(scope, periodKey);

  function handleAdd(text) {
    const position = items.length ? Math.max(...items.map((p) => p.position)) + 1 : 0;
    add.mutate({ text, position });
  }

  return (
    <ListCard title={title}>
      <EditableList
        items={items}
        withCheckbox
        addPlaceholder="Add a priority..."
        emptyLabel="Nothing yet."
        onAdd={handleAdd}
        onToggle={(id, done) => update.mutate({ id, fields: { done } })}
        onEdit={(id, text) => update.mutate({ id, fields: { text } })}
        onDelete={(id) => remove.mutate(id)}
        onReorder={(orderedItems) => reorder.mutate(orderedItems)}
      />
    </ListCard>
  );
}

export default function PrioritiesPanel({ weekKey, monthKey, enabled }) {
  return (
    <>
      <PriorityListCard title="This Week's Priorities" scope="week" periodKey={weekKey} enabled={enabled} />
      <PriorityListCard title="This Month's Priorities" scope="month" periodKey={monthKey} enabled={enabled} />
    </>
  );
}
