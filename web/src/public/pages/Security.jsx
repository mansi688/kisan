import React from 'react';
import { ShieldIcon, ReceiptIcon, ClipboardCheckIcon, CoinsIcon } from '../../components/icons.jsx';
import Seo from '../../components/Seo.jsx';

const ITEMS = [
  ['Server-enforced financial rules', 'The 75% financing cap, the 9-month/31-August maturity rule, the 90% risk ceiling and the settlement waterfall all live in one backend module — never decided in a browser or app.'],
  ['Password hashing', 'Every password — farmer, financer, warehouse operator, admin — is hashed before storage, never kept or logged in plain text.'],
  ['Digital consent on financial decisions', 'Selecting a financing offer requires a one-time confirmation step, separate from the login session, before money moves.'],
  ['Maker-checker on stock intake', 'An intake with an unusually high reject percentage is held for a second person\u2019s sign-off before it can result in a warehouse receipt — the same person can\u2019t record and approve it.'],
  ['Append-only audit log', 'Every meaningful action — registration, booking, intake, WR issuance, offer, disbursement, bid, decision, settlement — is logged with an actor, a timestamp and an entity reference, and is never edited after the fact.'],
  ['Role-based access', 'Every write endpoint checks the caller\u2019s role server-side — a farmer\u2019s session cannot disburse a loan, and a financer\u2019s session cannot open an auction.']
];

export default function Security() {
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="Security & Trust" description="What's actually protecting your money and data on KisanUnnatti — server-enforced rules, password hashing, audit logging, and role-based access." />
      <p className="pub-eyebrow">Security & Trust</p>
      <h1 className="pub-h1" style={{ maxWidth: '20ch' }}>What's actually protecting your money and your data</h1>
      <p className="pub-lede">
        Not a badge wall — the specific mechanisms in place today, and what's still ahead before this
        is ready for real, regulated financial use.
      </p>

      <div className="trust-grid">
        {ITEMS.map(([title, desc], i) => (
          <div className="trust-item" key={i}>
            <div className="trust-icon">
              {[<ShieldIcon key="s" width={16} height={16} />, <CoinsIcon key="c" width={16} height={16} />, <ReceiptIcon key="r" width={16} height={16} />, <ClipboardCheckIcon key="cc" width={16} height={16} />][i % 4]}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{title}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pub-body" style={{ marginTop: '2.5rem' }}>
        <h3>What's still ahead</h3>
        <p>
          Before this platform handles real farmer money, three things are non-negotiable and are
          called out plainly rather than glossed over: a production OTP/SMS gateway in place of the
          current development flow, a real payments/escrow integration for settlement, and an
          independent legal and compliance review covering contracts, KYC/AML and warehouse-receipt
          regulations in the relevant jurisdiction.
        </p>
      </div>
    </section>
  );
}
