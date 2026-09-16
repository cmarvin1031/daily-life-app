import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../lib/toastStore.js';
import * as api from './calendarApi.js';

export function useCalendarEvents(dateKey) {
  return useQuery({
    queryKey: ['calendarEvents', dateKey],
    queryFn: () => api.getEventsForDay(dateKey),
    // The mirror only changes when a sync runs, so there's no point
    // refetching it on every focus like the old live integration had to.
    staleTime: 5 * 60 * 1000,
  });
}

export function useCalendarSyncStatus() {
  return useQuery({ queryKey: ['calendarSyncStatus'], queryFn: api.getSyncStatus });
}

export function useSyncCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.triggerSync,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['calendarSyncStatus'] });
      const failed = result?.failedCalendars?.length
        ? ` (${result.failedCalendars.length} calendar${result.failedCalendars.length === 1 ? '' : 's'} skipped)`
        : '';
      showToast(`Calendar synced — ${result?.events ?? 0} events from ${result?.calendars ?? 0} calendars${failed}.`, {
        kind: 'success',
      });
    },
  });
}
