import React from 'react';
import Seo from '../../components/Seo.jsx';
import { Link } from 'react-router-dom';

export default function CookiePreferences() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Cookie Preferences" description="KisanUnnatti uses no analytics or non-essential tracking, so there is nothing to opt in or out of." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch' }}>Cookie Preferences</h1>
      <div className="pub-body">
        <h3>There's nothing to opt in or out of here yet</h3>
        <p>
          This platform doesn't use analytics, advertising, or any third-party tracking script —
          so there's no non-essential cookie category to give you a toggle for. A preference
          screen with switches for categories that don't exist would just be for show, so this
          page tells you plainly instead: everything kept in your browser is the four functional
          items listed on the <Link to="/cookies">Cookie Policy</Link> page — your session token,
          your cached profile, and your light/dark theme choice. None of it is used to track you
          across sites or shown to advertisers.
        </p>
        <h3>If that changes</h3>
        <p>
          If analytics or any non-essential tracking is ever added to this platform, this page
          will be replaced with an actual preference control at that point — not before.
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          See the <Link to="/cookies">Cookie Policy</Link> for the full, itemized list of what's stored and why.
        </p>
      </div>
    </section>
  );
}
