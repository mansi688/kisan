import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useParticipantAuth } from './ParticipantAuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { expiredMessage } from '../session.js';

/** role: 'FINANCER' | 'WSP_CM' | 'ADMIN'. title/subtitle/redirectTo/demoHint are display-only.
 *  identifierLabel/identifierType let Admin use a plain username (type="text")
 *  while Financer/WSP keep a real email address (type="email") — using
 *  type="email" for a non-email string like "admin" would fail the browser's
 *  own built-in validation before the form ever submits. */
export default function ParticipantLogin({ title, subtitle, redirectTo, demoHint, identifierLabel = 'Email', identifierType = 'email' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(expiredMessage);
  const [loading, setLoading] = useState(false);
  const { login, role, participant } = useParticipantAuth();
  const [arrivedSignedIn] = useState(!!participant);
  const navigate = useNavigate();

  if (arrivedSignedIn) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { participant, token } = await api.participantLogin(role, email, password);
      login(participant, token);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-brand">
          <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
          <span className="brand-name">KisanUnnatti</span>
        </div>
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>{identifierLabel}</label>
              <input type={identifierType} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="participant-password">Password</label>
              <PasswordInput id="participant-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-wheat" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {demoHint && <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '1.2rem' }}>{demoHint}</p>}
          {role !== 'ADMIN' && (
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
              <Link to="/demo">🧪 Or skip straight in via Demo Mode</Link>
            </p>
          )}
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '1rem' }}>
            By signing in, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
