import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { supabase } from '../lib/supabaseClient.js';
import { formatRelativeTime } from '../lib/dateUtils.js';
import { getThemePref, setThemePref } from '../lib/theme.js';
import { useCalendarSyncStatus, useSyncCalendar } from '../features/calendar/useCalendarData.js';
import './SettingsView.css';

const THEMES = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function SettingsView({ onClose }) {
  const { session } = useAuth();
  const { data: syncStatus, isError: syncStatusUnavailable } = useCalendarSyncStatus();
  const sync = useSyncCalendar();
  const [theme, setTheme] = useState(getThemePref);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const syncLabel = syncStatusUnavailable
    ? 'Sync status unavailable'
    : syncStatus === undefined
      ? '…'
      : syncStatus.lastSyncedAt
        ? `📅 Synced ${formatRelativeTime(syncStatus.lastSyncedAt)}`
        : 'Not synced yet';

  function chooseTheme(key) {
    setTheme(key);
    setThemePref(key);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="card settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2 id="settings-title">Settings</h2>
          <button className="btn-icon" aria-label="Close settings" onClick={onClose} autoFocus>
            ✕
          </button>
        </div>

        <div className="settings-row">
          <span className="text-muted">Signed in as</span>
          <span className="settings-email">{session?.user?.email}</span>
        </div>

        <div className="settings-row">
          <span className="text-muted" id="appearance-label">
            Appearance
          </span>
          <div className="segmented settings-theme" role="group" aria-labelledby="appearance-label">
            {THEMES.map((t) => (
              <button key={t.key} type="button" aria-pressed={theme === t.key} onClick={() => chooseTheme(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <span className="text-muted">Google Calendar</span>
          <div className="settings-gcal-row">
            <span className={syncStatus?.lastSyncedAt ? 'settings-gcal-status' : 'settings-gcal-status text-muted'}>
              {syncLabel}
            </span>
            <button className="btn btn-secondary" onClick={() => sync.mutate()} disabled={sync.isPending}>
              {sync.isPending ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
          <span className="text-muted settings-gcal-hint">
            Syncs automatically every day. Only calendars ticked in Google Calendar's sidebar are included.
          </span>
        </div>

        <button className="btn btn-secondary settings-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
