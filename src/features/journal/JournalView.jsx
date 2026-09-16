import { useEffect, useRef, useState } from 'react';
import { toDateKey } from '../../lib/dateUtils.js';
import { useDebouncedActions } from '../../lib/useDebouncedActions.js';
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
          instead of needing an effect to reset it. Unmounting also flushes
          any pending save for the day being left. */}
      <JournalEditor key={dateKey} dateKey={dateKey} />
    </div>
  );
}

function JournalEditor({ dateKey }) {
  const { data: entry, isLoading } = useJournalEntry(dateKey);
  const save = useSaveJournalEntry();
  const { schedule: queueSave } = useDebouncedActions(SAVE_DELAY_MS);

  const [body, setBody] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved
  const loadedRef = useRef(false);

  useEffect(() => {
    if (entry !== undefined && !loadedRef.current) {
      setBody(entry?.body || '');
      loadedRef.current = true;
    }
  }, [entry]);

  function handleChange(e) {
    const value = e.target.value;
    setBody(value);
    setStatus('pending');
    queueSave('body', () => {
      setStatus('saving');
      save.mutate(
        { dateKey, body: value },
        {
          onSuccess: () => setStatus('saved'),
          onError: () => setStatus('idle'),
        },
      );
    });
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
