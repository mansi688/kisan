import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';
import { UsersIcon, CoinsIcon, WarehouseIcon } from '../../components/icons.jsx';
import { LoadingSkeleton } from '../../components/ui.jsx';
import Seo from '../../components/Seo.jsx';
import { saveParticipantSession } from '../../session.js';

const ROLES = [
  { role: 'FARMER', label: 'Farmer', desc: 'Store produce, borrow against it, watch the market, decide when to sell.', icon: UsersIcon, tone: 'wheat', redirect: '/dashboard' },
  { role: 'FINANCER', label: 'Financer', desc: 'Browse the marketplace, submit offers, monitor your loan book.', icon: CoinsIcon, tone: 'field', redirect: '/financer/overview' },
  { role: 'WSP_CM', label: 'Warehouse / WSP-CM', desc: 'Record bookings and stock intake, issue digital receipts.', icon: WarehouseIcon, tone: 'ink', redirect: '/wsp/overview' }
  // Admin is intentionally not offered here — see the note below the grid.
];

export default function Demo() {
  // null = checking, true/false = the server answered, 'unreachable' = it never did.
  // (Previously a failed request was treated as "Demo Mode is off" — which told
  // people a false thing about the server whenever it simply wasn't running.)
  const [enabled, setEnabled] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingRole, setLoadingRole] = useState('');
  const [error, setError] = useState('');
  const { login: loginFarmer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setEnabled(null);
    api.demoStatus().then(s => setEnabled(!!s.enabled)).catch(() => setEnabled('unreachable'));
  }, [attempt]);

  async function enter(role) {
    setError(''); setLoadingRole(role);
    try {
      const data = await api.demoLogin(role);
      const config = ROLES.find(r => r.role === role);
      if (role === 'FARMER') {
        loginFarmer(data.farmer, data.token);
      } else {
        saveParticipantSession(role, data.participant, data.token);
      }
      navigate(config.redirect);
    } catch (err) {
      setError(err.message);
      setLoadingRole('');
    }
  }

  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="Demo Mode" description="Explore KisanUnnatti instantly as a Farmer, Financer or Warehouse operator — no OTP, seeded demo accounts." />
      <p className="pub-eyebrow">🧪 Demo Mode</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch' }}>Explore the platform, no OTP required</h1>
      <p className="pub-lede">
        Real OTP/SMS verification is a Phase-2 integration, not implemented yet — this build ships
        real login for every role instead. Pick a role below to enter instantly with a seeded demo
        account.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {enabled === null && <div style={{ marginTop: '1.5rem' }}><LoadingSkeleton rows={1} /></div>}

      {enabled === 'unreachable' && (
        <div className="empty-state">
          <div className="empty-state-title">Can't reach the KisanUnnatti server</div>
          <p className="empty-state-desc">
            The page loaded, but the API didn't answer. If you're running this yourself, start it with
            <code> npm start </code> from the project folder, then try again.
          </p>
          <button className="btn btn-wheat btn-sm" onClick={() => setAttempt(a => a + 1)}>Try again</button>
        </div>
      )}

      {enabled === false && (
        <div className="empty-state">
          <div className="empty-state-title">Demo Mode is switched off on this deployment</div>
          <p className="empty-state-desc">Use the normal login for your role instead.</p>
        </div>
      )}

      {enabled === true && (
        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          {ROLES.map(({ role, label, desc, icon: Icon, tone }) => (
            <button
              key={role}
              className="ledger-card"
              style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)' }}
              onClick={() => enter(role)}
              disabled={!!loadingRole}
            >
              <div className="metric-top" style={{ marginBottom: '0.6rem' }}>
                <span className="metric-label" style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{label}</span>
                <span className={`metric-icon ${tone}`}><Icon width={16} height={16} /></span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0 0 0.9rem' }}>{desc}</p>
              <span className="btn btn-wheat btn-sm" style={{ pointerEvents: 'none' }}>
                {loadingRole === role ? 'Entering…' : `Enter as ${label.split(' ')[0]}`}
              </span>
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
        Admin isn't offered here by design — it's locked to one seeded credential
        (no self-registration, no no-password entry) rather than an open demo role.
        Use <Link to="/admin/login">Admin login</Link> directly.
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '0.6rem' }}>
        Prefer the real thing for the others? <Link to="/login">Farmer login</Link> · <Link to="/financer/login">Financer</Link> · <Link to="/wsp/login">Warehouse</Link>
      </p>
    </section>
  );
}
