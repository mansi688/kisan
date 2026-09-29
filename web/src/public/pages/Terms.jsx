import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function Terms() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Terms & Conditions" description="The terms governing use of the KisanUnnatti platform — accounts, acceptable use, and platform functionality." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Terms of Service</h1>
      <p className="pub-lede">Last updated: placeholder — replace with counsel-reviewed terms before this platform handles real transactions.</p>
      <div className="pub-body">
        <h3>What this platform is</h3>
        <p>KisanUnnatti connects farmers, warehouse operators, financers and processors around a shared record of stored commodity, its financed value, and its eventual sale. It is not itself a bank, an NBFC, or a warehouse operator.</p>
        <h3>Financial rules</h3>
        <p>Financing is capped at 75% of a warehouse receipt's computed value, loans run for a maximum of 9 months or until 31 August of the following year (whichever is sooner), and a warehouse receipt cannot be pledged to more than one active loan at a time. These rules are enforced by the platform and are not negotiable within it.</p>
        <h3>Your responsibilities</h3>
        <p>Information you submit for registration and KYC must be accurate. Financers and warehouse operators are responsible for the accuracy of the offers and stock-intake records they submit.</p>
        <h3>Disputes</h3>
        <p>Every meaningful action on the platform is logged with a timestamp and actor for the purpose of resolving disputes between participants.</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page is placeholder content for a working platform, not a legally reviewed agreement — it should not be relied on as one.
        </p>
      </div>
    </section>
  );
}
