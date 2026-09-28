// Appearance preference: 'system' (follow the device), 'light' or 'dark'.
// Stored per device in localStorage. The palette itself lives in index.css;
// this only sets data-theme on <html> when the user overrides the system,
// and keeps the browser/status-bar colour (<meta name="theme-color">) in
// step. index.html applies the stored override before first paint so there
// is no flash of the wrong theme.

const KEY = 'theme';
const BAR_COLOR = { light: '#ffffff', dark: '#18181b' }; // matches --surface
const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function getThemePref() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function effectiveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return darkQuery?.matches ? 'dark' : 'light';
}

export function applyTheme(pref = getThemePref()) {
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOR[effectiveTheme(pref)]);
}

export function setThemePref(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // storage unavailable (private mode): still apply for this session
  }
  applyTheme(pref);
}

// Call once at startup: applies the stored preference and follows the
// device switching between light and dark while the app is open.
export function initTheme() {
  applyTheme();
  darkQuery?.addEventListener('change', () => applyTheme());
}
