import { useQuery } from '@tanstack/react-query';
import { fetchCalendarList, fetchDayEvents } from './googleCalendarApi.js';

// The list of calendars the user has access to (including calendars shared
// with them) rarely changes, so it's cached separately from day-to-day
// event data with a much longer staleTime.
export function useGoogleCalendarList(accessToken, onExpired) {
  return useQuery({
    queryKey: ['googleCalendarList'],
    queryFn: async () => {
      try {
        return await fetchCalendarList(accessToken);
      } catch (err) {
        if (err.code === 'TOKEN_EXPIRED') onExpired();
        throw err;
      }
    },
    enabled: !!accessToken,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useGoogleCalendarEvents(dateKey, accessToken, calendarIds, onExpired) {
  return useQuery({
    queryKey: ['googleCalendarEvents', dateKey, calendarIds?.join(',')],
    queryFn: async () => {
      try {
        return await fetchDayEvents(accessToken, dateKey, calendarIds);
      } catch (err) {
        if (err.code === 'TOKEN_EXPIRED') onExpired();
        throw err;
      }
    },
    enabled: !!accessToken && !!calendarIds && calendarIds.length > 0,
    // Short on purpose: this mirrors a live external calendar, so a new
    // event added elsewhere should show up on the next focus/revisit
    // rather than sitting behind a long cache window.
    staleTime: 30 * 1000,
    retry: false,
  });
}
