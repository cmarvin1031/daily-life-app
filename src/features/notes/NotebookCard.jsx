import { useState } from 'react';
import ExpandToggle from '../../components/ExpandToggle.jsx';
import { PALETTE_COLORS, paletteColorValue } from '../../lib/colorPalette.js';
import NoteCard from './NoteCard.jsx';
import { useNoteMutations, useNotes } from './useNotesData.js';

export default function NotebookCard({ notebook, count, onRename, onColorChange, onDelete }) {
  const color = paletteColorValue(notebook.color);
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(notebook.title);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const { data: notes = [] } = useNotes(notebook.id, expanded);
  const { add, update, remove } = useNoteMutations(notebook.id);

  function commitTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== notebook.title) onRename(trimmed);
  }

  function toggleExpanded() {
    setExpanded((v) => {
      const next = !v;
      if (!next) {
        setEditOpen(false);
        setShowAddNote(false);
      }
      return next;
    });
  }

  function toggleEdit() {
    if (editOpen) {
      commitTitle();
      setEditOpen(false);
    } else {
      setTitleValue(notebook.title);
      setEditOpen(true);
    }
  }

  function handleAddNote(e) {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    const position = notes.length ? Math.max(...notes.map((n) => n.position)) + 1 : 0;
    add.mutate({ title: newNoteTitle.trim(), position });
    setNewNoteTitle('');
  }

  function handleDeleteNote(note) {
    if (window.confirm(`Permanently delete "${note.title || 'this page'}"? This can't be undone.`)) {
      remove.mutate(note.id);
    }
  }

  return (
    <div className="card notebook-card" style={{ borderLeftColor: color }}>
      <div className="notebook-card-main">
        <ExpandToggle expanded={expanded} onClick={toggleExpanded} label="notebook" />
        <div className="notebook-card-avatar" style={{ background: color }}>
          📓
        </div>
        <div className="notebook-card-text">
          <span className="notebook-card-title">{notebook.title}</span>
          <span className="text-muted notebook-card-count">
            {count || 0} page{count === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="notebook-details">
          <div className="notebook-details-top">
            <button
              className="notebook-edit-btn"
              onClick={toggleEdit}
              aria-label={editOpen ? 'Done editing notebook' : 'Edit notebook'}
            >
              {editOpen ? '✓ Done' : '✎ Edit'}
            </button>
          </div>

          {editOpen && (
            <div className="notebook-details-row">
              <input
                className="notebook-title-input"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitTitle();
                    setEditOpen(false);
                  }
                  if (e.key === 'Escape') {
                    setTitleValue(notebook.title);
                    setEditOpen(false);
                  }
                }}
              />
              <button className="btn btn-secondary notebook-delete-btn" onClick={onDelete}>
                Delete notebook
              </button>
            </div>
          )}

          {editOpen && (
            <div className="notebook-color-picker">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={c.key === notebook.color ? 'notebook-color-swatch active' : 'notebook-color-swatch'}
                  style={{ background: c.value }}
                  onClick={() => onColorChange(c.key)}
                  aria-label={`Set color to ${c.key}`}
                />
              ))}
            </div>
          )}

          <div className="notebook-pages">
            {notes.length === 0 && <p className="text-muted notebook-pages-empty">No pages yet.</p>}
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} update={update} onDelete={() => handleDeleteNote(note)} />
            ))}
          </div>

          {showAddNote ? (
            <form className="notebook-add-page-form" onSubmit={handleAddNote}>
              <input
                autoFocus
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Page title..."
              />
              <button className="btn btn-secondary" type="submit">
                Add
              </button>
            </form>
          ) : (
            <button className="notebook-add-page-toggle" onClick={() => setShowAddNote(true)}>
              + Add Page
            </button>
          )}
        </div>
      )}
    </div>
  );
}
