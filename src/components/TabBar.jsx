import { NAV_ITEMS } from './navItems.js';
import NavIcon from './NavIcon.jsx';
import './TabBar.css';

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <nav className="tab-bar" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const active = activeTab === item.key;
        return (
          <button
            key={item.key}
            className={`tab-bar-item${active ? ' active' : ''}`}
            onClick={() => onSelectTab(item.key)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-bar-icon">
              <NavIcon name={item.key} />
            </span>
            <span className="tab-bar-label">{item.shortLabel ?? item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
