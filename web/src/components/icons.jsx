import React from 'react';

const base = {
  width: 18, height: 18, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round'
};

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" /></svg>
);
export const WarehouseIcon = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 5l9 5.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M8 21v-6h8v6" /><path d="M8 13h8" /></svg>
);
export const FinanceIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="13" rx="1.5" /><path d="M3 10h18" /><path d="M7 14h4" /></svg>
);
export const AuctionIcon = (p) => (
  <svg {...base} {...p}><path d="M14 5 19 10" /><path d="M6 13l5-5 6 6-5 5z" /><path d="M4 21l4-4" /><path d="M2 21h6" /></svg>
);
export const SettlementIcon = (p) => (
  <svg {...base} {...p}><path d="M4 4v16h16" /><path d="M7 15l3.5-4 3 2.5L18 9" /></svg>
);
export const LogoutIcon = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
);
export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>
);
export const CoinsIcon = (p) => (
  <svg {...base} {...p}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v6c0 1.66 2.69 3 6 3s6-1.34 6-3V7" /><path d="M15 10.2c2.9.3 6 1.5 6 3.3s-2.69 3-6 3-6-1.34-6-3" /><path d="M9 16v2c0 1.66 2.69 3 6 3s6-1.34 6-3v-6" /></svg>
);
export const ReceiptIcon = (p) => (
  <svg {...base} {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6" /><path d="M9 12h6" /></svg>
);
export const ClipboardCheckIcon = (p) => (
  <svg {...base} {...p}><rect x="6" y="4" width="12" height="17" rx="1.5" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M9 13l2 2 4-4" /></svg>
);
export const HistoryIcon = (p) => (
  <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg>
);
export const UsersIcon = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3" /><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.2c2.6.4 4.5 2.3 4.5 5.8" /></svg>
);
export const ShieldIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const TrendingIcon = (p) => (
  <svg {...base} {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const HelpIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.6" /><path d="M12 17.5h.01" /></svg>
);
export const MailIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
export const PhoneIcon = (p) => (
  <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
export const MapPinIcon = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const MenuIcon2 = MenuIcon; // alias for public nav
export const EyeIcon = (p) => (
  <svg {...base} {...p}><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = (p) => (
  <svg {...base} {...p}><path d="M3 3l18 18" /><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a17.6 17.6 0 0 1-3.2 4.1M6.5 6.9C3.6 8.8 1.5 12 1.5 12s3.5 7 10.5 7c1.4 0 2.7-.28 3.8-.75" /><path d="M9.5 9.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.06" /></svg>
);
