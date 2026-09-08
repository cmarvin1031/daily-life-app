import './ExpandToggle.css';

export default function ExpandToggle({ expanded, onClick, label = 'details' }) {
  return (
    <button
      type="button"
      className={expanded ? 'expand-toggle expanded' : 'expand-toggle'}
      onClick={onClick}
      aria-label={expanded ? `Hide ${label}` : `Show ${label}`}
    />
  );
}
