import { useSyncExternalStore } from 'react';
import { dismissToast, getSnapshot, subscribe } from '../lib/toastStore.js';
import './Toaster.css';

export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (toasts.length === 0) return null;

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-dismiss" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
