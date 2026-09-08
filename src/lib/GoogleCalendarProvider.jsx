import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/useAuth.js';
import { GoogleCalendarContext } from './GoogleCalendarContext.js';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const STORAGE_KEY_PREFIX = 'google-calendar-connected';

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// Single shared Google OAuth connection for the whole app -- every consumer
// (Planner, Dashboard, ...) reads the same accessToken/connected state via
// context, instead of each holding its own independent copy. There's no
// backend to hold a refresh token, so this is a pure client-side
// implicit-flow token: it expires (~1hr) and we attempt a silent, popup-free
// re-auth on mount if the user previously connected. Silent re-auth relies
// on third-party-cookie access to Google, which iOS Safari restricts -- on
// iPhone this may just fall back to needing a manual "Connect" click again
// once the token expires.
export function GoogleCalendarProvider({ children }) {
  const { session } = useAuth();
  const storageKey = session?.user?.id ? `${STORAGE_KEY_PREFIX}:${session.user.id}` : null;

  const [accessToken, setAccessToken] = useState(null);
  const [connected, setConnected] = useState(() => !!storageKey && localStorage.getItem(storageKey) === '1');
  const [status, setStatus] = useState('idle'); // idle | connecting | error
  const [errorMessage, setErrorMessage] = useState('');
  const tokenClientRef = useRef(null);

  const initClient = useCallback(async () => {
    if (!CLIENT_ID) {
      throw new Error('Google Calendar is not configured (missing VITE_GOOGLE_CLIENT_ID).');
    }
    await loadGisScript();
    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
          if (response.error) {
            setStatus('error');
            setErrorMessage(response.error_description || response.error);
            return;
          }
          setAccessToken(response.access_token);
          setConnected(true);
          setStatus('idle');
          if (storageKey) localStorage.setItem(storageKey, '1');
        },
      });
    }
    return tokenClientRef.current;
  }, [storageKey]);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage('');
    try {
      const client = await initClient();
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  }, [initClient]);

  const disconnect = useCallback(() => {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    }
    setAccessToken(null);
    setConnected(false);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [accessToken, storageKey]);

  const handleExpired = useCallback(() => {
    setAccessToken(null);
  }, []);

  // Try a silent (popup-free) re-auth once on mount if we were previously
  // connected, so a reload doesn't always force a manual reconnect click.
  useEffect(() => {
    if (!connected || accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const client = await initClient();
        if (!cancelled) client.requestAccessToken({ prompt: '' });
      } catch {
        // Silent re-auth isn't guaranteed (e.g. iOS Safari blocking
        // third-party cookies); the user can just click Connect again.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { accessToken, connected, status, errorMessage, connect, disconnect, handleExpired };

  return <GoogleCalendarContext.Provider value={value}>{children}</GoogleCalendarContext.Provider>;
}
