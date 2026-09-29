import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import {
  HomeIcon, WarehouseIcon, FinanceIcon, AuctionIcon, SettlementIcon,
  LogoutIcon, MenuIcon, CloseIcon
} from './icons.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon },
  { to: '/warehouse', label: 'Warehouse', icon: WarehouseIcon },
  { to: '/financing', label: 'Finance', icon: FinanceIcon },
  { to: '/auction', label: 'Sell / Auction', icon: AuctionIcon },
  { to: '/settlements', label: 'Payments', icon: SettlementIcon }
];

export default function Sidebar({ open, onClose }) {
  const { farmer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className={`sidebar-scrim ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`} id="app-sidebar">
        <div className="sidebar-brand">
          <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
          <div>
            <div className="brand-name">KisanUnnatti</div>
            <div className="brand-tag">Commodity Finance & Price Discovery</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
            >
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        {farmer && (
          <div className="sidebar-foot">
            <div className="sidebar-user">
              Farmer ID
              <strong>{farmer.farmerId}</strong>
            </div>
            <div style={{ marginBottom: '0.7rem' }}>
              <ThemeToggle variant="panel" />
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ width: '100%', color: 'var(--panel-text)', borderColor: 'rgba(255,255,255,0.25)' }}
              onClick={() => { logout(); navigate('/login'); }}
            >
              <LogoutIcon width={15} height={15} /> Log out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileTopbar({ onMenu, open }) {
  return (
    <div className="mobile-topbar">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
        <span className="brand-name" style={{ fontSize: '1rem' }}>KisanUnnatti</span>
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

export function useSidebar() {
  const [open, setOpen] = useState(false);

  // Escape closes the mobile sidebar drawer — same expectation as any
  // other disclosure widget (see the public nav's mobile menu).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return { open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) };
}
