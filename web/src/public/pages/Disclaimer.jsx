import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function Disclaimer() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Disclaimer" description="KisanUnnatti is not a bank or NBFC, and this build is an early-stage platform — read what that means before relying on it." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Disclaimer</h1>
      <p className="pub-lede">Last updated: placeholder — replace with counsel-reviewed content before this platform handles real farmer data.</p>
      <div className="pub-body">
        <h3>Not a bank, not an NBFC</h3>
        <p>KisanUnnatti is a platform connecting farmers, warehouse operators, financers and processors around a shared record — it does not itself lend money, hold deposits, or operate a warehouse. Financing offers come from registered financer accounts; warehousing and stock verification come from registered warehouse operator accounts.</p>
        <h3>Market prices and valuations</h3>
        <p>Market rates entered by warehouse operators, and bids submitted by processors, reflect what those participants chose to enter — the platform computes valuations and settlements from those inputs but does not guarantee any particular price or the accuracy of a rate source.</p>
        <h3>Phase-1 status</h3>
        <p>Real OTP/SMS verification, a live payments/escrow integration, and an independent legal and compliance review are not yet in place — see Security & Trust for specifics. This is a working platform at an early stage, not a finished, audited financial product.</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page is placeholder content for a working platform, not a legally reviewed disclaimer — it should not be relied on as one.
        </p>
      </div>
    </section>
  );
}
