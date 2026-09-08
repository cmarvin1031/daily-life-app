import { useState } from 'react';
import SidebarNav from './SidebarNav.jsx';
import TabBar from './TabBar.jsx';
import SettingsView from './SettingsView.jsx';
import './AppShell.css';

export default function AppShell({ activeTab, onSelectTab, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

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

        <main className="app-shell-content">{children}</main>
      </div>

      <TabBar activeTab={activeTab} onSelectTab={onSelectTab} />

      {settingsOpen && <SettingsView onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
