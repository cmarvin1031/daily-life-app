import { useState } from 'react';
import { useNotebookMutations, useNotebooks, useNoteCounts } from './useNotesData.js';
import NotebookCard from './NotebookCard.jsx';
import './NotesView.css';

export default function NotesView() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotebook, setNewNotebook] = useState('');

  const { data: notebooks = [] } = useNotebooks();
  const { data: noteCounts = {} } = useNoteCounts(notebooks.map((n) => n.id));
  const { add, update, remove } = useNotebookMutations();

  function handleAdd(e) {
    e.preventDefault();
    if (!newNotebook.trim()) return;
    const position = notebooks.length ? Math.max(...notebooks.map((n) => n.position)) + 1 : 0;
    add.mutate({ title: newNotebook.trim(), position });
    setNewNotebook('');
  }

  function handleDeleteNotebook(notebook) {
    if (window.confirm(`Permanently delete "${notebook.title}" and all its pages? This can't be undone.`)) {
      remove.mutate(notebook.id);
    }
  }

  return (
    <div className="notes-view">
      <div className="notes-header">
        <h1>Notes</h1>
        <button
          className="btn-icon"
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={showAddForm ? 'Close add notebook form' : 'Add notebook'}
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {showAddForm && (
        <form className="card notes-add-bar" onSubmit={handleAdd}>
          <input
            autoFocus
            value={newNotebook}
            onChange={(e) => setNewNotebook(e.target.value)}
            placeholder="New notebook name..."
          />
          <button className="btn btn-primary" type="submit">
            + Add Notebook
          </button>
        </form>
      )}

      {notebooks.length === 0 ? (
        <p className="text-muted notes-empty">No notebooks yet — add one above to get started.</p>
      ) : (
        <div className="notes-list">
          {notebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              count={noteCounts[notebook.id]}
              onRename={(title) => update.mutate({ id: notebook.id, fields: { title } })}
              onColorChange={(color) => update.mutate({ id: notebook.id, fields: { color } })}
              onDelete={() => handleDeleteNotebook(notebook)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
