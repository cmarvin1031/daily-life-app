import './ListCard.css';

export function ListCard({ title, action, children, empty }) {
  const isEmpty = !children;
  return (
    // `is-empty` lets phones collapse an empty card to a single row
    // (title on the left, "nothing here" on the right).
    <div className={isEmpty ? 'card list-card is-empty' : 'card list-card'}>
      <div className="list-card-header">
        <h3>{title}</h3>
        {action}
      </div>
      {isEmpty ? <p className="text-muted list-card-empty">{empty || 'Nothing here yet.'}</p> : <div className="list-card-body">{children}</div>}
    </div>
  );
}

export function ListRow({ icon, iconColor = 'blue', title, subtitle, right, onClick }) {
  return (
    <div className={onClick ? 'list-row list-row--clickable' : 'list-row'} onClick={onClick}>
      {icon && (
        <span className={`list-row-icon list-row-icon--${iconColor}`}>
          <span>{icon}</span>
        </span>
      )}
      <div className="list-row-text">
        <span className="list-row-title">{title}</span>
        {subtitle && <span className="text-muted list-row-subtitle">{subtitle}</span>}
      </div>
      {right && <div className="list-row-right">{right}</div>}
    </div>
  );
}
