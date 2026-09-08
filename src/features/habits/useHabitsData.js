import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './habitsApi.js';

export function useHabits(archived = false, options = {}) {
  return useQuery({
    queryKey: ['habits', archived],
    queryFn: () => api.getHabits({ archived }),
    ...options,
  });
}

export function useHabitMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['habits'] });

  return {
    add: useMutation({ mutationFn: ({ name, position }) => api.addHabit(name, position), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, fields }) => api.updateHabit(id, fields), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (id) => api.archiveHabit(id), onSuccess: invalidate }),
    restore: useMutation({ mutationFn: (id) => api.restoreHabit(id), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => api.deleteHabitPermanently(id), onSuccess: invalidate }),
  };
}

export function useHabitLog(habitId) {
  return useQuery({ queryKey: ['habitLog', habitId], queryFn: () => api.getHabitLogDates(habitId) });
}

export function useAllHabitLogs() {
  return useQuery({ queryKey: ['allHabitLogs'], queryFn: api.getAllHabitLogsByHabit });
}

export function useTodayLoggedHabitIds(dateKey) {
  return useQuery({ queryKey: ['habitLogsForDate', dateKey], queryFn: () => api.getHabitIdsLoggedOn(dateKey) });
}

export function useHabitLogMutations(habitId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['habitLog', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habitLogsForDate'] });
  };

  return {
    log: useMutation({ mutationFn: (dateKey) => api.logHabitDay(habitId, dateKey), onSuccess: invalidate }),
    unlog: useMutation({ mutationFn: (dateKey) => api.unlogHabitDay(habitId, dateKey), onSuccess: invalidate }),
  };
}
