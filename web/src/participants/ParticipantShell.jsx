import React from 'react';
import { NavLink } from 'react-router-dom';
import { useParticipantAuth } from './ParticipantAuthContext.jsx';
import { LogoutIcon, MenuIcon, CloseIcon } from '../components/icons.jsx';
import { useSidebar } from '../components/Sidebar.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

/**
 * navItems: [{ to, label, icon: Component }]
 * brandTag: short line under the KisanUnnatti wordmark ("Financer Portal", …)
 */
export function ParticipantSidebar({ open, onClose, navItems, brandTag }) {
  const { participant, logout, role } = useParticipantAuth();

  return (
    <>
      <div className={`sidebar-scrim ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`} id="app-sidebar">
        <div className="sidebar-brand">
          <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
          <div>
            <div className="brand-name">KisanUnnatti</div>
            <div className="brand-tag">{brandTag}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
            >
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        {participant && (
          <div className="sidebar-foot">
            <div className="sidebar-user">
              {role.replace('_', '/')}
              <strong>{participant.name}</strong>
            </div>
            <div style={{ marginBottom: '0.7rem' }}>
              <ThemeToggle variant="panel" />
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ width: '100%', color: 'var(--panel-text)', borderColor: 'rgba(255,255,255,0.25)' }}
              onClick={logout}
            >
              <LogoutIcon width={15} height={15} /> Log out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export function ParticipantMobileTopbar({ onMenu, label, open }) {
  return (
    <div className="mobile-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
        <span className="brand-name" style={{ fontSize: '1rem' }}>{label}</span>
      </div>
      <button
        className="btn-ghost btn-icon"
        onClick={onMenu}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
    </div>
  );
}

/** Full page shell: sidebar + mobile topbar + content, or bare children when logged out (login screen). */
export function ParticipantShell({ navItems, brandTag, children }) {
  const { participant } = useParticipantAuth();
  const sidebar = useSidebar();

  if (!participant) return children;

  return (
    <div className="app-shell">
      <ParticipantSidebar open={sidebar.open} onClose={sidebar.close} navItems={navItems} brandTag={brandTag} />
      <div className="main-col">
        <ParticipantMobileTopbar onMenu={sidebar.toggle} label={brandTag} open={sidebar.open} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
