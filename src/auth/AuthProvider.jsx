import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  // Set when the user arrives through a password-reset email link. Supabase
  // signs them in with a recovery session; we still owe them a screen to
  // actually choose the new password.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  const value = useMemo(
    () => ({ session, passwordRecovery, clearPasswordRecovery }),
    [session, passwordRecovery, clearPasswordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
