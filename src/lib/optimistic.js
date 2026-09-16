// Builds the onMutate/onError/onSettled trio for an optimistic React Query
// mutation. `plan(vars)` returns one or more { key, apply } entries: the UI
// gets the applied result immediately, is rolled back if the server says
// no, and is re-synced from the server either way once the request settles.
export function optimistic(queryClient, plan, onSettled) {
  return {
    onMutate: async (vars) => {
      const entries = plan(vars);
      const snapshots = [];
      for (const { key, apply } of entries) {
        await queryClient.cancelQueries({ queryKey: key });
        const prev = queryClient.getQueryData(key);
        snapshots.push({ key, prev });
        if (prev !== undefined) queryClient.setQueryData(key, apply(prev));
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      for (const { key, prev } of ctx?.snapshots || []) {
        queryClient.setQueryData(key, prev);
      }
    },
    onSettled,
  };
}

// Common list transforms for the `apply` slot.
export const patchById = (id, fields) => (list) => list.map((item) => (item.id === id ? { ...item, ...fields } : item));
export const removeById = (id) => (list) => list.filter((item) => item.id !== id);
export const withPositions = (orderedItems) => () => orderedItems.map((item, index) => ({ ...item, position: index }));
