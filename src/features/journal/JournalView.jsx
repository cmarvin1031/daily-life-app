import { useEffect, useRef, useState } from 'react';
import { toDateKey } from '../../lib/dateUtils.js';
import DateNav from '../../components/DateNav.jsx';
import { useJournalEntry, useSaveJournalEntry } from './useJournalData.js';
import './JournalView.css';

const SAVE_DELAY_MS = 800;

export default function JournalView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateKey = toDateKey(currentDate);

  return (
    <div className="journal-view">
      <DateNav currentDate={currentDate} onChange={setCurrentDate} />
      {/* Keyed by date so switching days remounts with fresh local state
          instead of needing an effect to reset it. */}
      <JournalEditor key={dateKey} dateKey={dateKey} />
    </div>
  );
}

function JournalEditor({ dateKey }) {
  const { data: entry, isLoading } = useJournalEntry(dateKey);
  const save = useSaveJournalEntry(dateKey);

  const [body, setBody] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved
  const loadedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (entry !== undefined && !loadedRef.current) {
      setBody(entry?.body || '');
      loadedRef.current = true;
    }
  }, [entry]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleChange(e) {
    const value = e.target.value;
    setBody(value);
    setStatus('pending');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus('saving');
      save.mutate(value, {
        onSuccess: () => setStatus('saved'),
        onError: () => setStatus('idle'),
      });
    }, SAVE_DELAY_MS);
  }

  return (
    <div className="card journal-card">
      <div className="journal-card-header">
        <h3>Journal</h3>
        <span className="text-muted journal-status">
          {status === 'pending' && 'Editing…'}
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
        </span>
      </div>
      <textarea
        className="journal-textarea"
        value={body}
        onChange={handleChange}
        placeholder="Write about your day..."
        disabled={isLoading}
      />
    </div>
  );
}
