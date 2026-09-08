import { ListCard } from '../../components/ListCard.jsx';
import EditableList from '../../components/EditableList.jsx';
import { useTodos, useTodoMutations } from './usePlannerData.js';

export default function TodoList({ dateKey, enabled }) {
  const { data: todos = [] } = useTodos(dateKey, enabled);
  const { add, update, remove, reorder } = useTodoMutations(dateKey);

  function handleAdd(text) {
    const position = todos.length ? Math.max(...todos.map((t) => t.position)) + 1 : 0;
    add.mutate({ text, position });
  }

  return (
    <ListCard title="To-Do">
      <EditableList
        items={todos}
        withCheckbox
        addPlaceholder="Add a to-do..."
        emptyLabel="Nothing on the list yet."
        onAdd={handleAdd}
        onToggle={(id, done) => update.mutate({ id, fields: { done } })}
        onEdit={(id, text) => update.mutate({ id, fields: { text } })}
        onDelete={(id) => remove.mutate(id)}
        onReorder={(orderedItems) => reorder.mutate(orderedItems)}
      />
    </ListCard>
  );
}
