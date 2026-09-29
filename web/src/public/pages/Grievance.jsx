import React from 'react';
import Seo from '../../components/Seo.jsx';
import { Link } from 'react-router-dom';

export default function Grievance() {
  return (
    <section className="pub-section pub-section-narrow legal-page">
      <Seo title="Grievance & Support" description="How to raise a complaint or support request on KisanUnnatti, and what happens once you do." />
      <p className="pub-eyebrow">Legal</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch' }}>Grievance & Support</h1>
      <p className="pub-lede">Last updated: placeholder — replace with counsel-reviewed content and a named grievance officer before this platform handles real farmer data.</p>
      <div className="pub-body">
        <h3>How to raise an issue</h3>
        <p>Use the <Link to="/contact">Contact</Link> page — every message submitted there lands directly in the platform's Admin inbox, the same real submission path whether it's a general question or a formal complaint. Include your Farmer ID (or organization name, for financer/warehouse accounts) and the WR number, loan reference, or auction lot involved, if any.</p>
        <h3>What happens next</h3>
        <p>Every action that could affect a farmer's outstanding loan, WR status, or settlement — booking, stock intake, financing offer, disbursement, bid, decision, settlement — is recorded in the platform's audit log with a timestamp and the actor responsible, so a specific transaction can be traced and reviewed rather than argued from memory.</p>
        <h3>Formal escalation</h3>
        <p>A named grievance officer, a defined response-time commitment, and a documented escalation path are exactly the kind of detail that needs a real business decision behind it, not a placeholder — they'll be added here once set.</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '2rem' }}>
          This page is placeholder content for a working platform, not a legally reviewed grievance policy — it should not be relied on as one.
        </p>
      </div>
    </section>
  );
}
