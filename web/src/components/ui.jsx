import React from 'react';

/** Generic bordered surface — the base every card in the app sits on. */
export function Card({ children, className = '', style, ...rest }) {
  return <div className={`ledger-card ${className}`} style={style} {...rest}>{children}</div>;
}

/** Section heading with an optional subtitle and right-aligned actions (buttons, filters). */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/**
 * A top-level dashboard number: label, big mono value, an icon, and an
 * optional trend line. `trend` is a short string like "+3.2%" and `trendDir`
 * is 'up' | 'down' | 'flat' (defaults to neutral coloring).
 */
export function MetricCard({ label, value, icon, iconTone = 'wheat', trend, trendDir = 'flat' }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        {icon && <span className={`metric-icon ${iconTone}`}>{icon}</span>}
      </div>
      <div className="metric-value">{value}</div>
      {trend && <div className={`metric-trend ${trendDir}`}>{trend}</div>}
    </div>
  );
}

/** A tappable shortcut used in the dashboard's "Quick actions" row. */
export function QuickAction({ to, icon, iconTone = 'wheat', label, onClick, as: Comp = 'a' }) {
  const inner = (
    <>
      <span className={`metric-icon ${iconTone}`}>{icon}</span>
      {label}
    </>
  );
  if (onClick) {
    return <button className="quick-action" onClick={onClick} style={{ border: '1px solid var(--line)' }}>{inner}</button>;
  }
  return <Comp className="quick-action" href={to}>{inner}</Comp>;
}

const STATUS_MAP = {
  GREEN: { cls: 'badge-green', label: 'Green' },
  AMBER: { cls: 'badge-amber', label: 'Amber' },
  RED: { cls: 'badge-red', label: 'Red' },
  ACTIVE: { cls: 'badge-green', label: 'Active' },
  OPEN: { cls: 'badge-green', label: 'Open' },
  APPROVED: { cls: 'badge-green', label: 'Approved' },
  CLOSED: { cls: 'badge-neutral', label: 'Closed' },
  SETTLED: { cls: 'badge-neutral', label: 'Settled' },
  PENDING: { cls: 'badge-amber', label: 'Pending' },
  SUBMITTED: { cls: 'badge-wheat', label: 'Submitted' },
  SELECTED: { cls: 'badge-green', label: 'Selected' },
  REJECTED: { cls: 'badge-red', label: 'Rejected' },
  DISBURSED: { cls: 'badge-green', label: 'Disbursed' }
};

/** Renders any of the backend's status strings as a consistent colored pill. */
export function StatusBadge({ status, children }) {
  const meta = STATUS_MAP[status] || { cls: 'badge-neutral', label: status };
  return (
    <span className={`badge ${meta.cls}`}>
      <span className="badge-dot" />
      {children || meta.label}
    </span>
  );
}

/** Friendly placeholder for a list/table with nothing in it yet. */
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      {title && <div className="empty-state-title">{title}</div>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: '0.9rem' }}>{action}</div>}
    </div>
  );
}

/** Shimmering placeholder cards shown while a page's first data fetch is in flight. */
export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
}

/**
 * A dependency-free bar chart for small real-data comparisons (e.g. WR value
 * per lot, exposure per loan). Not for time series we don't actually have —
 * values should be real numbers already computed elsewhere, not invented.
 */
export function BarChart({ title, data, tone = 'wheat', format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card chart-card">
      {title && <p className="chart-title">{title}</p>}
      <div className="bar-chart">
        {data.map((d, i) => (
          <div className="bar-chart-col" key={i}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{format(d.value)}</span>
            <div
              className={`bar-chart-bar ${tone}`}
              style={{ height: `${Math.max(4, (d.value / max) * 92)}px` }}
              title={`${d.label}: ${format(d.value)}`}
            />
            <span className="bar-chart-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
