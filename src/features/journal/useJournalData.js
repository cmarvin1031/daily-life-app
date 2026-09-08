import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './journalApi.js';

export function useJournalEntry(dateKey) {
  return useQuery({ queryKey: ['journalEntry', dateKey], queryFn: () => api.getJournalEntry(dateKey) });
}

export function useSaveJournalEntry(dateKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.saveJournalEntry(dateKey, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journalEntry', dateKey] }),
  });
}
