import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './journalApi.js';

export function useJournalEntry(dateKey) {
  return useQuery({ queryKey: ['journalEntry', dateKey], queryFn: () => api.getJournalEntry(dateKey) });
}

// dateKey is passed per call so a save that flushes while the editor is
// unmounting still writes to the day it was typed on.
export function useSaveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dateKey, body }) => api.saveJournalEntry(dateKey, body),
    onSuccess: (_data, { dateKey }) => queryClient.invalidateQueries({ queryKey: ['journalEntry', dateKey] }),
  });
}
