import { useContext } from 'react';
import { GoogleCalendarContext } from './GoogleCalendarContext.js';

export function useGoogleCalendarConnection() {
  const ctx = useContext(GoogleCalendarContext);
  if (!ctx) throw new Error('useGoogleCalendarConnection must be used within GoogleCalendarProvider');
  return ctx;
}
