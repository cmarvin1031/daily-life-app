import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optimistic } from '../../lib/optimistic.js';
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

const without = (value) => (list) => list.filter((item) => item !== value);
const including = (value) => (list) => (list.includes(value) ? list : [...list, value]);

// Ticking a habit updates the row's check, its streak/week-strip and the
// summary ring immediately; the server round-trip only confirms it.
export function useHabitLogMutations(habitId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['habitLog', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habitLogsForDate'] });
    queryClient.invalidateQueries({ queryKey: ['allHabitLogs'] }); // Dashboard's streaks + week dots
  };

  const plan = (dateKey, logged) => [
    { key: ['habitLog', habitId], apply: logged ? including(dateKey) : without(dateKey) },
    { key: ['habitLogsForDate', dateKey], apply: logged ? including(habitId) : without(habitId) },
  ];

  return {
    log: useMutation({
      mutationFn: (dateKey) => api.logHabitDay(habitId, dateKey),
      ...optimistic(queryClient, (dateKey) => plan(dateKey, true), invalidate),
    }),
    unlog: useMutation({
      mutationFn: (dateKey) => api.unlogHabitDay(habitId, dateKey),
      ...optimistic(queryClient, (dateKey) => plan(dateKey, false), invalidate),
    }),
  };
}
