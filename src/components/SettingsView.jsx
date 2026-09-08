import { useAuth } from '../auth/useAuth.js';
import { supabase } from '../lib/supabaseClient.js';
import { useGoogleCalendarConnection } from '../lib/useGoogleCalendarConnection.js';
import './SettingsView.css';

export default function SettingsView({ onClose }) {
  const { session } = useAuth();
  const gcal = useGoogleCalendarConnection();
  const isConnected = gcal.connected && gcal.accessToken;

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="card settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="btn-icon" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-row">
          <span className="text-muted">Signed in as</span>
          <span className="settings-email">{session?.user?.email}</span>
        </div>

        <div className="settings-row">
          <span className="text-muted">Google Calendar</span>
          <div className="settings-gcal-row">
            <span className={isConnected ? 'settings-gcal-status' : 'settings-gcal-status text-muted'}>
              {isConnected ? '📅 Connected' : 'Not connected'}
            </span>
            {isConnected ? (
              <button className="btn btn-secondary" onClick={gcal.disconnect}>
                Disconnect
              </button>
            ) : (
              <button className="btn btn-primary" onClick={gcal.connect} disabled={gcal.status === 'connecting'}>
                {gcal.status === 'connecting' ? 'Connecting…' : 'Connect'}
              </button>
            )}
          </div>
          {gcal.status === 'error' && <span className="settings-gcal-error">{gcal.errorMessage}</span>}
        </div>

        <button className="btn btn-secondary settings-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
