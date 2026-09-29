import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function CookiePolicy() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Cookie Policy" description="What KisanUnnatti actually stores in your browser — a session token, your cached profile, and your theme preference. No tracking." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Cookie & Local Storage Policy</h1>
      <p className="pub-lede">Last updated: placeholder — replace with counsel-reviewed content before this platform handles real farmer data.</p>
      <div className="pub-body">
        <h3>What this platform actually stores in your browser</h3>
        <p>No third-party advertising or tracking cookies. Everything kept in your browser is functional: a session token so you stay signed in, and your light/dark theme preference. Both live in your browser's local storage, not a cookie.</p>
        <h3>Session token</h3>
        <p>Issued when you sign in (or use Demo Mode), it's what proves who you are on each request. It's removed when you log out or clear your browser's site data.</p>
        <h3>Theme preference</h3>
        <p>Whether you've chosen Light, Dark, or System — kept only so the site remembers your choice on your next visit.</p>
        <h3>What we don't do</h3>
        <p>No analytics or advertising trackers, no cross-site tracking, no selling of browsing data — there isn't any being collected to sell.</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page is placeholder content for a working platform, not a legally reviewed policy — it should not be relied on as one.
        </p>
      </div>
    </section>
  );
}
