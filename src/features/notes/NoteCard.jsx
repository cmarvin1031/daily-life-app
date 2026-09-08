import { useEffect, useRef, useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';

const SAVE_DELAY_MS = 800;

export default function NoteCard({ note, update, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== note.title) update.mutate({ id: note.id, fields: { title: trimmed } });
  }

  function handleBodyChange(e) {
    const v = e.target.value;
    setBody(v);
    setStatus('pending');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus('saving');
      update.mutate(
        { id: note.id, fields: { body: v } },
        { onSuccess: () => setStatus('saved'), onError: () => setStatus('idle') },
      );
    }, SAVE_DELAY_MS);
  }

  return (
    <div className="note-page">
      <div className="note-page-main">
        <ExpandToggle expanded={expanded} onClick={() => setExpanded((v) => !v)} label="page" />
        <span className="note-page-title">{note.title || 'Untitled'}</span>
      </div>

      {expanded && (
        <div className="note-page-details">
          <input
            className="note-page-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="Page title..."
          />
          <textarea className="note-textarea" value={body} onChange={handleBodyChange} placeholder="Write..." />
          <div className="note-details-footer">
            <span className="text-muted note-status">
              {status === 'pending' && 'Editing…'}
              {status === 'saving' && 'Saving…'}
              {status === 'saved' && 'Saved'}
            </span>
            <button className="note-delete-btn" onClick={onDelete}>
              Delete page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
