import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optimistic, patchById, removeById, withPositions } from '../../lib/optimistic.js';
import * as api from './plannerApi.js';

// Ensures the day is initialized (and rolled over from the prior day, if
// this is the first time it's been opened) before any other query for the
// same date runs. Child hooks gate on `.isSuccess` from this one.
export function useDayInit(dateKey) {
  return useQuery({
    queryKey: ['dayInit', dateKey],
    queryFn: async () => {
      await api.ensureDay(dateKey);
      return true;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSchedule(dateKey, enabled) {
  return useQuery({
    queryKey: ['schedule', dateKey],
    queryFn: () => api.getSchedule(dateKey),
    enabled,
  });
}

// dateKey travels with each call rather than being bound to the hook, so a
// debounced save queued for one day can never land on another one after
// the user has navigated away.
export function useSetScheduleHour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dateKey, hour, text }) => api.setScheduleHour(dateKey, hour, text),
    onSuccess: (_data, { dateKey, hour, text }) => {
      queryClient.setQueryData(['schedule', dateKey], (prev) => ({ ...(prev || {}), [hour]: text }));
    },
  });
}

export function useTodos(dateKey, enabled) {
  return useQuery({
    queryKey: ['todos', dateKey],
    queryFn: () => api.getTodos(dateKey),
    enabled,
  });
}

// Checks, edits, deletes and reorders apply to the list instantly and roll
// back if the server rejects them; adds still wait for the server since the
// new row's id is needed for anything else to happen to it.
export function useTodoMutations(dateKey) {
  const queryClient = useQueryClient();
  const key = ['todos', dateKey];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  return {
    add: useMutation({ mutationFn: ({ text, position }) => api.addTodo(dateKey, text, position), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, fields }) => api.updateTodo(id, fields),
      ...optimistic(queryClient, ({ id, fields }) => [{ key, apply: patchById(id, fields) }], invalidate),
    }),
    remove: useMutation({
      mutationFn: (id) => api.deleteTodo(id),
      ...optimistic(queryClient, (id) => [{ key, apply: removeById(id) }], invalidate),
    }),
    reorder: useMutation({
      mutationFn: (orderedItems) => api.reorderTodos(orderedItems),
      ...optimistic(queryClient, (orderedItems) => [{ key, apply: withPositions(orderedItems) }], invalidate),
    }),
  };
}

// Week/month counterpart of useDayInit; usePriorities gates on it so the
// rollover has run before a period's list is first read.
export function usePeriodInit(scope, periodKey) {
  return useQuery({
    queryKey: ['periodInit', scope, periodKey],
    queryFn: async () => {
      await api.ensurePeriod(scope, periodKey);
      return true;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function usePriorities(scope, periodKey, enabled = true) {
  const init = usePeriodInit(scope, periodKey);
  return useQuery({
    queryKey: ['priorities', scope, periodKey],
    queryFn: () => api.getPriorities(scope, periodKey),
    enabled: enabled && init.isSuccess,
  });
}

export function usePriorityMutations(scope, periodKey) {
  const queryClient = useQueryClient();
  const key = ['priorities', scope, periodKey];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  return {
    add: useMutation({
      mutationFn: ({ text, position }) => api.addPriority(scope, periodKey, text, position),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, fields }) => api.updatePriority(id, fields),
      ...optimistic(queryClient, ({ id, fields }) => [{ key, apply: patchById(id, fields) }], invalidate),
    }),
    remove: useMutation({
      mutationFn: (id) => api.deletePriority(id),
      ...optimistic(queryClient, (id) => [{ key, apply: removeById(id) }], invalidate),
    }),
    reorder: useMutation({
      mutationFn: (orderedItems) => api.reorderPriorities(orderedItems),
      ...optimistic(queryClient, (orderedItems) => [{ key, apply: withPositions(orderedItems) }], invalidate),
    }),
  };
}
