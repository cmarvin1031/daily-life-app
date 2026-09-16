import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { showToast } from '../lib/toastStore.js';
import './SignInView.css';

// Shown after the user arrives via a password-reset email link. Supabase has
// already signed them in with a recovery session at this point; all that's
// left is actually setting the new password.
export default function UpdatePasswordView({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      showToast('Password updated.', { kind: 'success' });
      onDone();
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
        <p className="text-muted signin-subtitle">Choose a new password</p>

        <label className="signin-field">
          <span>New password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="signin-field">
          <span>Confirm new password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        {error && <p className="signin-error">{error}</p>}

        <button className="btn btn-primary signin-submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : 'Update password'}
        </button>

        <div className="signin-links">
          <button type="button" className="signin-link" onClick={onDone}>
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
