import { useState } from 'react';
import { useOnline } from '../lib/useOnline.js';
import SidebarNav from './SidebarNav.jsx';
import TabBar from './TabBar.jsx';
import SettingsView from './SettingsView.jsx';
import './AppShell.css';

export default function AppShell({ activeTab, onSelectTab, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const online = useOnline();

  return (
    <div className="app-shell">
      <SidebarNav activeTab={activeTab} onSelectTab={onSelectTab} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="app-shell-main">
        <header className="app-shell-topbar">
          <span className="app-shell-topbar-brand">Daily Life</span>
          <button className="btn-icon" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            ⚙️
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
