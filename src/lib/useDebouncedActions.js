import { useCallback, useEffect, useRef } from 'react';

// Debounces keyed actions (e.g. one autosave per schedule hour) and, unlike a
// bare setTimeout, *flushes* rather than drops anything still pending when
// the component unmounts or flush() is called explicitly. Each `run` closure
// should capture everything it needs (the record id, the date key, the
// text) so it writes to the right place no matter what props have changed
// by the time it fires.
export function useDebouncedActions(delayMs) {
  const pendingRef = useRef(new Map()); // key -> { timer, run }

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    if (pending.size === 0) return;
    const runs = [...pending.values()];
    pending.clear();
    for (const { timer, run } of runs) {
      clearTimeout(timer);
      run();
    }
  }, []);

  const schedule = useCallback(
    (key, run) => {
      const pending = pendingRef.current;
      const existing = pending.get(key);
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => {
        pending.delete(key);
        run();
      }, delayMs);
      pending.set(key, { timer, run });
    },
    [delayMs],
  );

  useEffect(() => flush, [flush]);

  return { schedule, flush };
}
