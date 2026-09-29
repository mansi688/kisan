import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useParticipantAuth } from './ParticipantAuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

/** role: 'FINANCER' | 'WSP_CM'. */
export default function ParticipantRegister({ title, subtitle, orgLabel, redirectTo, loginPath }) {
  const [form, setForm] = useState({ name: '', email: '', orgName: '', password: '', consentAccepted: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, role, participant } = useParticipantAuth();
  const [arrivedSignedIn] = useState(!!participant);
  const navigate = useNavigate();

  if (arrivedSignedIn) return <Navigate to={redirectTo} replace />;

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { participant, token } = await api.participantRegister(role, form);
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
            <div className="field"><label>Full name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            <div className="field"><label>{orgLabel}</label><input value={form.orgName} onChange={e => set('orgName', e.target.value)} /></div>
            <div className="field">
              <label htmlFor="preg-password">Password</label>
              <PasswordInput id="preg-password" value={form.password} onChange={e => set('password', e.target.value)} required />
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.3rem' }}>
                At least 8 characters, with a mix of at least 3 of: uppercase, lowercase, numbers, symbols
              </p>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="preg-consent"
                style={{ width: 'auto', marginTop: '0.2rem' }}
                checked={form.consentAccepted}
                onChange={e => set('consentAccepted', e.target.checked)}
              />
              <label htmlFor="preg-consent" style={{ margin: 0, fontWeight: 400 }}>
                I agree to the <Link to="/terms">Terms &amp; Conditions</Link> and acknowledge the <Link to="/privacy">Privacy Policy</Link>
              </label>
            </div>
            <button className="btn btn-wheat" style={{ width: '100%' }} disabled={loading || !form.consentAccepted}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <hr className="hairline" />
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Already registered? <Link to={loginPath}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
