// Mirrors the user's Google Calendar into public.calendar_events.
//
// Runs on Supabase's edge runtime (Deno). Holds the one real secret in this
// project -- a long-lived Google refresh token -- so the browser never has
// to talk to Google at all. Called two ways:
//   1. On a schedule by pg_cron (supabase/calendar_sync_cron.sql), which
//      authenticates with the X-Sync-Secret header.
//   2. On demand from the app's Settings "Sync now" button, which sends the
//      signed-in user's JWT; only the configured SYNC_USER_ID is accepted.
//
// Secrets (Dashboard -> Edge Functions -> Secrets, or `supabase secrets set`):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
//   SYNC_USER_ID, SYNC_SECRET, and optionally SYNC_ALL_CALENDARS=true.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN') ?? '';
const SYNC_USER_ID = Deno.env.get('SYNC_USER_ID') ?? '';
const SYNC_SECRET = Deno.env.get('SYNC_SECRET') ?? '';
// By default only calendars ticked in Google Calendar's sidebar are synced,
// which doubles as the "which calendars?" picker (untick Holidays there and
// it disappears here on the next sync). Set to "true" to sync everything.
const SYNC_ALL_CALENDARS = Deno.env.get('SYNC_ALL_CALENDARS') === 'true';

// Browser origins allowed to call this function (the Settings "Sync now"
// button). Cron doesn't go through CORS. Override with a comma-separated
// ALLOWED_ORIGINS secret if the app moves.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://cmarvin1031.github.io,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const PAST_DAYS = 30;
const FUTURE_DAYS = 90;
const UPSERT_CHUNK = 500;

// Compact JWT: three base64url segments. Anything else in the Authorization
// header is rejected before we spend a round-trip asking Supabase Auth.
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

type GoogleCalendar = { id: string; summary?: string; selected?: boolean };
type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};
type EventRow = {
  user_id: string;
  calendar_id: string;
  calendar_name: string;
  google_event_id: string;
  title: string;
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date: string | null;
  synced_at: string;
};

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const providedSecret = req.headers.get('x-sync-secret');
  if (SYNC_SECRET && providedSecret === SYNC_SECRET) return true;

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return false;
  if (!JWT_SHAPE.test(authHeader.slice('Bearer '.length).trim())) return false;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  return !!user && user.id === SYNC_USER_ID;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

async function googleGet(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google API ${res.status} for ${url}: ${await res.text()}`);
  return res.json();
}

async function listCalendars(token: string): Promise<GoogleCalendar[]> {
  const data = await googleGet('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader', token);
  const calendars = (data.items ?? []) as GoogleCalendar[];
  return SYNC_ALL_CALENDARS ? calendars : calendars.filter((c) => c.selected === true);
}

async function listEvents(token: string, calendarId: string, timeMin: string, timeMax: string): Promise<GoogleEvent[]> {
  const items: GoogleEvent[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true', // expands recurring events into instances
      orderBy: 'startTime',
      maxResults: '2500',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await googleGet(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      token,
    );
    items.push(...((data.items ?? []) as GoogleEvent[]));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

function toRow(userId: string, calendar: GoogleCalendar, event: GoogleEvent, syncedAt: string): EventRow | null {
  const allDay = !event.start?.dateTime;
  if (allDay && !(event.start?.date && event.end?.date)) return null;
  if (!allDay && !(event.start?.dateTime && event.end?.dateTime)) return null;
  return {
    user_id: userId,
    calendar_id: calendar.id,
    calendar_name: calendar.summary ?? '',
    google_event_id: event.id,
    title: event.summary ?? '',
    all_day: allDay,
    start_at: allDay ? null : new Date(event.start.dateTime!).toISOString(),
    end_at: allDay ? null : new Date(event.end.dateTime!).toISOString(),
    start_date: allDay ? event.start.date! : null,
    end_date: allDay ? event.end.date! : null,
    synced_at: syncedAt,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'POST only' });

  // Auth first: an unauthenticated caller learns nothing about how this
  // function is configured, not even which secrets are unset.
  if (!(await isAuthorized(req))) return json(req, 401, { error: 'Unauthorized' });

  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'SYNC_USER_ID', 'SYNC_SECRET'].filter(
    (name) => !Deno.env.get(name),
  );
  if (missing.length > 0) return json(req, 500, { error: `Missing function secrets: ${missing.join(', ')}` });

  try {
    const syncedAt = new Date().toISOString();
    const now = new Date();
    const timeMin = new Date(now.getTime() - PAST_DAYS * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + FUTURE_DAYS * 86400000).toISOString();

    const token = await getAccessToken();
    const calendars = await listCalendars(token);

    const rows: EventRow[] = [];
    const failedCalendars: string[] = [];
    for (const calendar of calendars) {
      try {
        const events = await listEvents(token, calendar.id, timeMin, timeMax);
        for (const event of events) {
          if (event.status === 'cancelled') continue;
          const row = toRow(SYNC_USER_ID, calendar, event, syncedAt);
          if (row) rows.push(row);
        }
      } catch (err) {
        // One broken/inaccessible calendar shouldn't take down the rest.
        console.warn(`Skipping calendar ${calendar.id}:`, err);
        failedCalendars.push(calendar.summary ?? calendar.id);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const { error } = await admin
        .from('calendar_events')
        .upsert(rows.slice(i, i + UPSERT_CHUNK), { onConflict: 'user_id,calendar_id,google_event_id' });
      if (error) throw new Error(`Upsert failed: ${error.message}`);
    }

    // Every event Google still has was just stamped with this run's
    // synced_at. Anything older is gone from Google (deleted, moved out of
    // the window, or on a calendar that's no longer ticked) -- unless that
    // calendar failed this run, in which case leave its rows alone rather
    // than wiping them over a transient error.
    let removeQuery = admin.from('calendar_events').delete({ count: 'exact' }).eq('user_id', SYNC_USER_ID).lt('synced_at', syncedAt);
    if (failedCalendars.length > 0) {
      const failedIds = calendars.filter((c) => failedCalendars.includes(c.summary ?? c.id)).map((c) => c.id);
      removeQuery = removeQuery.not('calendar_id', 'in', `(${failedIds.map((id) => `"${id}"`).join(',')})`);
    }
    const { error: deleteError, count: removed } = await removeQuery;
    if (deleteError) throw new Error(`Cleanup failed: ${deleteError.message}`);

    return json(req, 200, {
      ok: true,
      syncedAt,
      calendars: calendars.length - failedCalendars.length,
      events: rows.length,
      removed: removed ?? 0,
      failedCalendars,
    });
  } catch (err) {
    console.error('Sync failed', err);
    return json(req, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});
