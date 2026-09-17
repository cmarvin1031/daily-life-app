import { useEffect, useState } from 'react';
import { toDateKey } from './dateUtils.js';

// "Now", refreshed whenever the app returns to the foreground and at the
// next local midnight. Without this, a PWA left open overnight keeps
// yesterday's date in every `new Date()` computed at render time -- so it
// never opens the new day, never runs the todo rollover, and shows stale
// "remaining today" lists until a cold start.
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);

    // One second past midnight, local time; re-armed after each refresh.
    const midnight = new Date(now);
    midnight.setHours(24, 0, 1, 0);
    const timer = setTimeout(refresh, midnight - now);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      clearTimeout(timer);
    };
  }, [now]);

  return now;
}

export function useToday() {
  return toDateKey(useNow());
}
