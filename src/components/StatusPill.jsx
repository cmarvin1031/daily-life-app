import './StatusPill.css';

const TONES = {
  done: 'pill-green',
  completed: 'pill-green',
  'in-progress': 'pill-blue',
  active: 'pill-blue',
  pending: 'pill-gray',
  archived: 'pill-gray',
};

export default function StatusPill({ status, children }) {
  const tone = TONES[status] || 'pill-gray';
  return <span className={`status-pill ${tone}`}>{children || status}</span>;
}
