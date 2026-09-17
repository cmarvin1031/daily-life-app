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

// [{ date, value }] for one habit.
export function useHabitLog(habitId) {
  return useQuery({ queryKey: ['habitLog', habitId], queryFn: () => api.getHabitLogs(habitId) });
}

// { [habitId]: [{ date, value }] } for every habit.
export function useAllHabitLogs() {
  return useQuery({ queryKey: ['allHabitLogs'], queryFn: api.getAllHabitLogsByHabit });
}

// { [habitId]: value } for one date.
export function useLogsForDate(dateKey) {
  return useQuery({ queryKey: ['habitLogsForDate', dateKey], queryFn: () => api.getLogsForDate(dateKey) });
}

// Cache transforms. `value === undefined` means "remove the day's log".
const setLogEntry = (dateKey, value) => (logs) => {
  const rest = logs.filter((l) => l.date !== dateKey);
  return value === undefined ? rest : [{ date: dateKey, value }, ...rest];
};
const setMapEntry = (habitId, value) => (map) => {
  const next = { ...map };
  if (value === undefined) delete next[habitId];
  else next[habitId] = value;
  return next;
};

// Logging a habit updates the row, its streak/week-strip, the summary ring
// and the Dashboard immediately; the server round-trip only confirms it.
export function useHabitLogMutations(habitId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['habitLog', habitId] });
    queryClient.invalidateQueries({ queryKey: ['habitLogsForDate'] });
    queryClient.invalidateQueries({ queryKey: ['allHabitLogs'] });
  };

  const plan = (dateKey, value) => [
    { key: ['habitLog', habitId], apply: setLogEntry(dateKey, value) },
    { key: ['habitLogsForDate', dateKey], apply: setMapEntry(habitId, value) },
    {
      key: ['allHabitLogs'],
      apply: (byHabit) => ({ ...byHabit, [habitId]: setLogEntry(dateKey, value)(byHabit[habitId] || []) }),
    },
  ];

  return {
    // Plain check-off.
    log: useMutation({
      mutationFn: (dateKey) => api.setHabitLog(habitId, dateKey, null),
      ...optimistic(queryClient, (dateKey) => plan(dateKey, null), invalidate),
    }),
    // Quantity habits: 0 clears the day.
    setValue: useMutation({
      mutationFn: ({ dateKey, value }) =>
        value > 0 ? api.setHabitLog(habitId, dateKey, value) : api.unlogHabitDay(habitId, dateKey),
      ...optimistic(queryClient, ({ dateKey, value }) => plan(dateKey, value > 0 ? value : undefined), invalidate),
    }),
    unlog: useMutation({
      mutationFn: (dateKey) => api.unlogHabitDay(habitId, dateKey),
      ...optimistic(queryClient, (dateKey) => plan(dateKey, undefined), invalidate),
    }),
  };
}
