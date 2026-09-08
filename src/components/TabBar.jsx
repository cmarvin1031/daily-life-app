import { NAV_ITEMS } from './navItems.js';
import './TabBar.css';

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <nav className="tab-bar">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`tab-bar-item${activeTab === item.key ? ' active' : ''}`}
          onClick={() => onSelectTab(item.key)}
        >
          <span className="tab-bar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
