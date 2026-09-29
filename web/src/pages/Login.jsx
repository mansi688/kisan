import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { expiredMessage } from '../session.js';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(expiredMessage);
  const [loading, setLoading] = useState(false);
  const { login, farmer } = useAuth();
  // Someone who is ALREADY signed in has no business on the login form (and
  // seeing the sidebar next to it was confusing) — send them to their dashboard.
  // Decided once, on arrival, so a successful login here still navigates normally.
  const [arrivedSignedIn] = useState(!!farmer);
  const navigate = useNavigate();

  if (arrivedSignedIn) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { farmer, token } = await api.loginFarmer(mobile, password);
      login(farmer, token);
      navigate('/dashboard');
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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in with your registered mobile number.</p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Mobile number</label>
              <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="98765 43210" required />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <PasswordInput id="login-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-wheat" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <hr className="hairline" />
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            New to KisanUnnatti? <Link to="/register">Register your Farmer ID</Link>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.8rem' }}>
            Staff sign in: <Link to="/financer/login">Financer</Link> · <Link to="/wsp/login">Warehouse/WSP</Link> · <Link to="/admin/login">Admin</Link>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
            <Link to="/demo">🧪 Try Demo Mode instead</Link> — skip login, no OTP required
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '1rem' }}>
            By signing in, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
