import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optimistic, withPositions } from '../../lib/optimistic.js';
import { reorderRows } from '../../lib/reorder.js';
import * as notebooksApi from './notebooksApi.js';
import * as notesApi from './notesApi.js';

export function useNotebooks() {
  return useQuery({ queryKey: ['notebooks'], queryFn: notebooksApi.getNotebooks });
}

export function useNoteCounts(notebookIds) {
  const key = notebookIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['noteCounts', key],
    queryFn: () => notesApi.getNoteCounts(notebookIds),
    enabled: notebookIds.length > 0,
  });
}

export function useNotebookMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notebooks'] });

  return {
    add: useMutation({
      mutationFn: ({ title, position }) => notebooksApi.addNotebook(title, position),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, fields }) => notebooksApi.updateNotebook(id, fields),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id) => notebooksApi.deleteNotebook(id), onSuccess: invalidate }),
    reorder: useMutation({
      mutationFn: (orderedItems) => reorderRows('notebooks', orderedItems),
      ...optimistic(queryClient, (orderedItems) => [{ key: ['notebooks'], apply: withPositions(orderedItems) }], invalidate),
    }),
  };
}

export function useNotes(notebookId, enabled = true) {
  return useQuery({
    queryKey: ['notes', notebookId],
    queryFn: () => notesApi.getNotes(notebookId),
    enabled: !!notebookId && enabled,
  });
}

export function useNoteMutations(notebookId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notes', notebookId] });
    queryClient.invalidateQueries({ queryKey: ['noteCounts'] });
  };

  return {
    add: useMutation({
      mutationFn: ({ title, position }) => notesApi.addNote(notebookId, title, position),
      onSuccess: invalidate,
    }),
    update: useMutation({ mutationFn: ({ id, fields }) => notesApi.updateNote(id, fields), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => notesApi.deleteNote(id), onSuccess: invalidate }),
    reorder: useMutation({
      mutationFn: (orderedItems) => reorderRows('notes', orderedItems),
      ...optimistic(
        queryClient,
        (orderedItems) => [{ key: ['notes', notebookId], apply: withPositions(orderedItems) }],
        invalidate,
      ),
    }),
  };
}
