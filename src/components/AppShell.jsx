import { useState } from 'react';
import { useOnline } from '../lib/useOnline.js';
import { formatDisplayDate } from '../lib/dateUtils.js';
import SidebarNav from './SidebarNav.jsx';
import TabBar from './TabBar.jsx';
import SettingsView from './SettingsView.jsx';
import NavIcon from './NavIcon.jsx';
import './AppShell.css';

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AppShell({ activeTab, onSelectTab, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const online = useOnline();
  const now = new Date();

  return (
    <div className="app-shell">
      <SidebarNav activeTab={activeTab} onSelectTab={onSelectTab} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="app-shell-main">
        {/* Phone-only top bar. On the Dashboard it doubles as the page
            header (date + greeting) so the view doesn't need its own big
            title eating the first screenful. */}
        <header className="app-shell-topbar">
          {activeTab === 'dashboard' ? (
            <div className="app-shell-topbar-title">
              <span className="text-muted app-shell-topbar-kicker">{formatDisplayDate(now)}</span>
              <span className="app-shell-topbar-heading">{greetingFor(now)}</span>
            </div>
          ) : (
            <span className="app-shell-topbar-brand">Daily Life</span>
          )}
          <button className="btn-icon app-shell-settings-btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <NavIcon name="settings" size={18} />
          </button>
        </header>

        {!online && (
          <div className="app-offline-banner" role="status">
            You're offline — changes won't be saved until you reconnect. Keep the app open.
          </div>
        )}

        <main className="app-shell-content">{children}</main>
      </div>

      <TabBar activeTab={activeTab} onSelectTab={onSelectTab} />

      {settingsOpen && <SettingsView onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
