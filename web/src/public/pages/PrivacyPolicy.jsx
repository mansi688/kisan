import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function PrivacyPolicy() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Privacy Policy" description="What personal and commodity data KisanUnnatti collects, why, and how it is protected." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Privacy Policy</h1>
      <p className="pub-lede">Last updated: placeholder — replace with a counsel-reviewed policy before this platform handles real farmer data.</p>
      <div className="pub-body">
        <h3>What we collect</h3>
        <p>Registration details (name, date of birth, mobile number, address), KYC information (Aadhaar last 4 digits, PAN), bank account details for settlement, and records of your bookings, warehouse receipts, loans, bids and settlements as you use the platform.</p>
        <h3>How it's used</h3>
        <p>Solely to operate the commodity-financing lifecycle described in How It Works — verifying your identity, computing your warehouse receipt's value, matching you with financing offers, and settling proceeds after a sale.</p>
        <h3>Who it's shared with</h3>
        <p>Registered financers and warehouse operators see only what's necessary to do their part of the transaction (e.g. a financer sees a WR's value and commodity, not your bank account details). Processors bidding at auction see the lot's commodity, quantity and quality, not your identity.</p>
        <h3>Your rights</h3>
        <p>You can request a copy of your data or its deletion, subject to records we're legally required to retain (e.g. completed loan and settlement history).</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page is placeholder content for a working platform, not a legally reviewed policy — it should not be relied on as one.
        </p>
      </div>
    </section>
  );
}
