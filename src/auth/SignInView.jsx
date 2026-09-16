import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import './SignInView.css';

// There's deliberately no sign-up form: this is a single-user app and new
// sign-ups are switched off in the Supabase project's Auth settings, so the
// public Pages URL can't be used to create accounts against the project.
export default function SignInView() {
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else if (mode === 'reset') {
        // Send the user back to this deployment (dev or Pages) rather than
        // the project's default Site URL. The URL must also be listed under
        // Authentication -> URL Configuration -> Redirect URLs in Supabase.
        const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).href;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (resetError) throw resetError;
        setMessage('Password reset email sent. Open the link on this device to choose a new password.');
        setMode('sign-in');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signin-page">
      <form className="card signin-card" onSubmit={handleSubmit}>
        <h1>Daily Life</h1>
        <p className="text-muted signin-subtitle">
          {mode === 'sign-in' && 'Sign in to continue'}
          {mode === 'reset' && 'Reset your password'}
        </p>

        <label className="signin-field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {mode !== 'reset' && (
          <label className="signin-field">
            <span>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}

        {error && <p className="signin-error">{error}</p>}
        {message && <p className="signin-message">{message}</p>}

        <button className="btn btn-primary signin-submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Send reset link'}
        </button>

        <div className="signin-links">
          {mode === 'sign-in' ? (
            <button type="button" className="signin-link" onClick={() => setMode('reset')}>
              Forgot password?
            </button>
          ) : (
            <button type="button" className="signin-link" onClick={() => setMode('sign-in')}>
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
