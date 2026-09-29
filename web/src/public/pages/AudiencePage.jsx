import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';

const TABS = [
  { to: '/for-farmers', label: 'Farmers' },
  { to: '/for-financers', label: 'Financers' },
  { to: '/for-warehouses', label: 'Warehouses' }
];

export default function AudiencePage({ eyebrow, title, lede, points, ctaText, ctaTo }) {
  const { pathname } = useLocation();
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title={eyebrow} description={lede} />
      <div className="audience-tabs">
        {TABS.map(t => <Link key={t.to} to={t.to} className={`audience-tab ${pathname === t.to ? 'active' : ''}`}>{t.label}</Link>)}
      </div>
      <p className="pub-eyebrow">{eyebrow}</p>
      <h1 className="pub-h1" style={{ maxWidth: '22ch' }}>{title}</h1>
      <p className="pub-lede">{lede}</p>
      <div className="pub-body">
        {points.map(([h, p], i) => (
          <React.Fragment key={i}>
            <h3>{h}</h3>
            <p>{p}</p>
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link to={ctaTo} className="btn btn-wheat">{ctaText}</Link>
      </div>
    </section>
  );
}
