import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useSetScheduleHour(dateKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hour, text }) => api.setScheduleHour(dateKey, hour, text),
    onSuccess: (_data, { hour, text }) => {
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

export function useTodoMutations(dateKey) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['todos', dateKey] });

  return {
    add: useMutation({ mutationFn: ({ text, position }) => api.addTodo(dateKey, text, position), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, fields }) => api.updateTodo(id, fields), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => api.deleteTodo(id), onSuccess: invalidate }),
    reorder: useMutation({ mutationFn: (orderedItems) => api.reorderTodos(orderedItems), onSuccess: invalidate }),
  };
}

export function usePriorities(scope, periodKey, enabled) {
  return useQuery({
    queryKey: ['priorities', scope, periodKey],
    queryFn: () => api.getPriorities(scope, periodKey),
    enabled,
  });
}

export function usePriorityMutations(scope, periodKey) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['priorities', scope, periodKey] });

  return {
    add: useMutation({
      mutationFn: ({ text, position }) => api.addPriority(scope, periodKey, text, position),
      onSuccess: invalidate,
    }),
    update: useMutation({ mutationFn: ({ id, fields }) => api.updatePriority(id, fields), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => api.deletePriority(id), onSuccess: invalidate }),
    reorder: useMutation({ mutationFn: (orderedItems) => api.reorderPriorities(orderedItems), onSuccess: invalidate }),
  };
}
