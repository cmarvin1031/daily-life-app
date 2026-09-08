const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';

function eventsUrlFor(calendarId) {
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
}

async function googleFetch(url, accessToken) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401) {
    const err = new Error('Google Calendar token expired');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }
  if (!response.ok) throw new Error(`Google Calendar request failed (${response.status})`);
  return response.json();
}

// Every calendar the user has access to, including calendars shared with
// them -- not just their own primary calendar.
export async function fetchCalendarList(accessToken) {
  const data = await googleFetch(CALENDAR_LIST_URL, accessToken);
  return (data.items || []).map((cal) => ({ id: cal.id, summary: cal.summary }));
}

// Fetches the given local day's events (both timed and all-day) across all
// of the given calendars. Read-only -- never writes anything back.
export async function fetchDayEvents(accessToken, dateKey, calendarIds) {
  const dayStart = new Date(`${dateKey}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const params = new URLSearchParams({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const perCalendar = await Promise.all(
    calendarIds.map(async (calendarId) => {
      try {
        const data = await googleFetch(`${eventsUrlFor(calendarId)}?${params}`, accessToken);
        return data.items || [];
      } catch (err) {
        if (err.code === 'TOKEN_EXPIRED') throw err;
        // One inaccessible/broken calendar shouldn't take down the rest.
        console.warn(`Failed to load events for calendar ${calendarId}`, err);
        return [];
      }
    }),
  );

  const events = perCalendar.flat().map((item) => ({
    id: item.id,
    title: item.summary || '(No title)',
    allDay: !item.start.dateTime,
    start: item.start.dateTime ? new Date(item.start.dateTime) : new Date(`${item.start.date}T00:00:00`),
    end: item.end.dateTime ? new Date(item.end.dateTime) : new Date(`${item.end.date}T00:00:00`),
  }));

  return {
    allDay: events.filter((e) => e.allDay),
    timed: events.filter((e) => !e.allDay),
  };
}
