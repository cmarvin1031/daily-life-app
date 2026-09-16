import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

// Mirrors React Query's own online/offline tracking so the banner and the
// paused-mutation behavior always agree with each other.
export function useOnline() {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true,
  );
}
