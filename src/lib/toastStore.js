// Tiny app-wide toast store. No provider needed: modules (like the React
// Query error handlers) call showToast() directly, and <Toaster /> renders
// whatever's current via useSyncExternalStore.

const DEFAULT_DURATION_MS = 5000;

let toasts = [];
let nextId = 1;
const listeners = new Set();

function emit() {
  toasts = [...toasts];
  for (const listener of listeners) listener();
}

export function showToast(message, { kind = 'error', duration = DEFAULT_DURATION_MS } = {}) {
  if (!message) return;
  // A failing query that refetches on every focus would otherwise stack the
  // same message over and over.
  if (toasts.some((t) => t.message === message)) return;

  const id = nextId++;
  toasts.push({ id, message, kind });
  emit();
  if (duration > 0) setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id) {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return toasts;
}

// Turns a thrown error (Supabase, fetch, Google) into something worth
// showing. Returns null for errors that already have their own UI.
export function friendlyErrorMessage(err) {
  if (!err) return null;
  if (err.code === 'TOKEN_EXPIRED') return null; // Google Calendar handles this itself
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return "You're offline — that change wasn't saved.";
  }
  const message = err.message || '';
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (err.code === 'PGRST301' || /jwt expired/i.test(message)) {
    return 'Your session expired. Please sign in again.';
  }
  return message || 'Something went wrong.';
}
