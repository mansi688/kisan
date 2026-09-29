import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MenuIcon, CloseIcon } from '../components/icons.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const NAV = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/for-farmers', label: 'For Farmers' },
  { to: '/for-financers', label: 'For Financers' },
  { to: '/for-warehouses', label: 'For Warehouses' },
  { to: '/market', label: 'Market' },
  { to: '/security', label: 'Security & Trust' },
  { to: '/faq', label: 'FAQ' }
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  // Escape closes the mobile menu — standard behavior for any disclosure
  // widget, and the only way to close it without a mouse once it's open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <header className="pub-nav">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <img className="brand-mark" style={{ borderColor: 'var(--wheat-dark)' }} src="/logo.webp" alt="KisanUnnatti" />
          <span className="brand-name" style={{ color: 'var(--ink)', fontSize: '1.05rem' }}>KisanUnnatti</span>
        </Link>
        <nav className="pub-nav-links">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `pub-nav-link ${isActive ? 'active' : ''}`}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="pub-nav-actions">
          <ThemeToggle />
          <Link to="/demo" className="btn btn-outline btn-sm pub-nav-login-desktop">🧪 Demo</Link>
          <Link to="/login" className="btn btn-outline btn-sm pub-nav-login-desktop">Log in</Link>
          <Link to="/register" className="btn btn-wheat btn-sm">Register</Link>
          <button
            className="btn-ghost btn-icon pub-nav-toggle"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="pub-mobile-menu"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>
      {open && (
        <div className="pub-mobile-menu" id="pub-mobile-menu" role="navigation" aria-label="Mobile">
          {NAV.map(n => <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Link to="/demo" onClick={() => setOpen(false)}>🧪 Demo Mode</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Theme:</span>
            <ThemeToggle />
          </div>
          <hr className="hairline" style={{ margin: '0.4rem 0' }} />
          <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link to="/register" onClick={() => setOpen(false)}>Register</Link>
        </div>
      )}
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
            <span className="brand-name" style={{ color: 'var(--panel-text)' }}>KisanUnnatti</span>
          </div>
          <p style={{ color: 'var(--panel-text-soft)', fontSize: '0.85rem', maxWidth: '32ch', lineHeight: 1.6 }}>
            Digital commodity pledge finance, warehouse receipts and price discovery — store your produce, unlock its value, sell when the price is right.
          </p>
        </div>
        <div className="pub-footer-col">
          <p className="pub-footer-col-title">Platform</p>
          <Link to="/for-farmers">For Farmers</Link>
          <Link to="/for-financers">For Financers</Link>
          <Link to="/for-warehouses">For Warehouses</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/demo">Explore Platform</Link>
        </div>
        <div className="pub-footer-col">
          <p className="pub-footer-col-title">Company</p>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/help">Help / Support</Link>
        </div>
        <div className="pub-footer-col">
          <p className="pub-footer-col-title">Resources</p>
          <Link to="/market">Market</Link>
          <Link to="/security">Security</Link>
          <Link to="/accessibility">Accessibility</Link>
        </div>
        <div className="pub-footer-col">
          <p className="pub-footer-col-title">Legal &amp; Trust</p>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/cookies">Cookie Policy</Link>
          <Link to="/cookie-preferences">Cookie Preferences</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <Link to="/grievance">Grievance</Link>
        </div>
      </div>
      <div className="pub-footer-bottom">
        <span>© {new Date().getFullYear()} KisanUnnatti. All rights reserved.</span>
        <span>Built for the digital commodity pledge finance & warehouse receipt journey.</span>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="pub-shell">
      <PublicNav />
      <main className="pub-main">{children}</main>
      <PublicFooter />
    </div>
  );
}
