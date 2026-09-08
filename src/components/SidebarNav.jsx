import { NAV_ITEMS } from './navItems.js';
import './SidebarNav.css';

export default function SidebarNav({ activeTab, onSelectTab, onOpenSettings }) {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">◐</span>
        <span>Daily Life</span>
      </div>

      <div className="sidebar-section-label">Menu</div>
      <nav className="sidebar-items">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item${activeTab === item.key ? ' active' : ''}`}
            onClick={() => onSelectTab(item.key)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section-label">General</div>
      <nav className="sidebar-items">
        <button className="sidebar-item" onClick={onOpenSettings}>
          <span className="sidebar-item-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}
