import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import './SignInView.css';

export default function SignInView() {
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up' | 'reset'
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
      } else if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Account created. Check your email to confirm, then sign in.');
        setMode('sign-in');
      } else if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        setMessage('Password reset email sent.');
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
          {mode === 'sign-up' && 'Create your account'}
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
              minLength={6}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}

        {error && <p className="signin-error">{error}</p>}
        {message && <p className="signin-message">{message}</p>}

        <button className="btn btn-primary signin-submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Sign up' : 'Send reset link'}
        </button>

        <div className="signin-links">
          {mode !== 'sign-in' && (
            <button type="button" className="signin-link" onClick={() => setMode('sign-in')}>
              Back to sign in
            </button>
          )}
          {mode === 'sign-in' && (
            <>
              <button type="button" className="signin-link" onClick={() => setMode('sign-up')}>
                Create an account
              </button>
              <button type="button" className="signin-link" onClick={() => setMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
