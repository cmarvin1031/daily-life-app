import { supabase } from '../../lib/supabaseClient.js';
import { addDays, parseDateKey } from '../../lib/dateUtils.js';

// Reads the Google Calendar mirror kept up to date by the
// sync-google-calendar Edge Function. Nothing here talks to Google.

// Same shape the Planner/Dashboard consumed from the old live integration:
// { allDay: [...], timed: [...] } with real Date objects.
export async function getEventsForDay(dateKey) {
  const dayStart = parseDateKey(dateKey);
  const dayEnd = addDays(dayStart, 1);

  const [timedRes, allDayRes] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, calendar_name, start_at, end_at')
      .eq('all_day', false)
      .gte('start_at', dayStart.toISOString())
      .lt('start_at', dayEnd.toISOString())
      .order('start_at', { ascending: true }),
    supabase
      .from('calendar_events')
      .select('id, title, calendar_name, start_date, end_date')
      .eq('all_day', true)
      .lte('start_date', dateKey)
      .gt('end_date', dateKey) // Google's all-day end date is exclusive
      .order('title', { ascending: true }),
  ]);
  if (timedRes.error) throw timedRes.error;
  if (allDayRes.error) throw allDayRes.error;

  return {
    timed: timedRes.data.map((row) => ({
      id: row.id,
      title: row.title || '(No title)',
      calendar: row.calendar_name,
      allDay: false,
      start: new Date(row.start_at),
      end: new Date(row.end_at),
    })),
    allDay: allDayRes.data.map((row) => ({
      id: row.id,
      title: row.title || '(No title)',
      calendar: row.calendar_name,
      allDay: true,
      start: parseDateKey(row.start_date),
      end: parseDateKey(row.end_date),
    })),
  };
}

// When the mirror was last refreshed (null if it's never run / is empty).
export async function getSyncStatus() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { lastSyncedAt: data ? new Date(data.synced_at) : null };
}

// Asks the Edge Function to sync right now. supabase-js sends the signed-in
// user's JWT automatically; the function only honors it for the configured
// user.
export async function triggerSync() {
  const { data, error } = await supabase.functions.invoke('sync-google-calendar', { method: 'POST', body: {} });
  if (error) {
    // A non-2xx response arrives as FunctionsHttpError with the raw Response
    // attached; prefer the function's own message when it sent one.
    let message = error.message || 'Calendar sync failed.';
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return data;
}
