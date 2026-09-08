import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './goalsApi.js';

export function useGoals(statuses, options = {}) {
  return useQuery({
    queryKey: ['goals', statuses ? statuses.join(',') : 'all'],
    queryFn: () => api.getGoals(statuses),
    ...options,
  });
}

export function useGoalTaskCounts(goalIds) {
  const key = goalIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['goalTaskCounts', key],
    queryFn: () => api.getTaskCountsForGoals(goalIds),
    enabled: goalIds.length > 0,
  });
}

export function useGoalMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['goals'] });

  return {
    add: useMutation({
      mutationFn: ({ title, position, category, goalType, counterTarget }) =>
        api.addGoal(title, position, { category, goalType, counterTarget }),
      onSuccess: invalidate,
    }),
    update: useMutation({ mutationFn: ({ id, fields }) => api.updateGoal(id, fields), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => api.deleteGoal(id), onSuccess: invalidate }),
  };
}

export function useGoalTasks(goalId, enabled = true) {
  return useQuery({
    queryKey: ['goalTasks', goalId],
    queryFn: () => api.getGoalTasks(goalId),
    enabled: !!goalId && enabled,
  });
}

export function useGoalTaskMutations(goalId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['goalTasks', goalId] });
    queryClient.invalidateQueries({ queryKey: ['goalTaskCounts'] });
  };

  return {
    add: useMutation({
      mutationFn: ({ text, position }) => api.addGoalTask(goalId, text, position),
      onSuccess: invalidate,
    }),
    update: useMutation({ mutationFn: ({ id, fields }) => api.updateGoalTask(id, fields), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => api.deleteGoalTask(id), onSuccess: invalidate }),
    reorder: useMutation({ mutationFn: (orderedItems) => api.reorderGoalTasks(orderedItems), onSuccess: invalidate }),
  };
}
