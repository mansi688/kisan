import React from 'react';
import Seo from '../../components/Seo.jsx';

const FAQS = [
  ['What is a warehouse receipt (WR)?', 'A digital record of commodity you\u2019ve stored: quantity, quality grade, warehouse, and a valuation (quantity × an approved market rate). It\u2019s what you borrow against, and what a buyer eventually pays for.'],
  ['How much financing can I get?', 'Up to 75% of your WR\u2019s value. If your WR is worth ₹1,00,000, the maximum any offer can request is ₹75,000 — the platform rejects anything higher before it\u2019s even shown to you.'],
  ['How long can a loan run?', 'Up to 9 months from disbursement, or 31 August of the following year — whichever comes first.'],
  ['What happens if my exposure gets close to the ceiling?', 'Your dashboard shows total exposure (principal + accrued interest + storage charges) against 90% of your WR\u2019s original value, in green/amber/red, recalculated every time you check.'],
  ['Can the same WR be pledged to two lenders?', 'No — once a WR is pledged, its lien status blocks any further financing offers or disbursements against it until the loan closes.'],
  ['How is the sale price decided?', 'Registered processors bid within an open window on your lot. You see the highest valid bid (H1) alongside your outstanding loan numbers before deciding to accept, negotiate, or wait.'],
  ['What do I actually receive after a sale?', 'A settlement statement showing the full waterfall: sale proceeds, minus principal, minus accrued interest, minus storage charges, minus any other approved charges — with the remainder as your payable amount.'],
  ['Is my OTP verification production-grade right now?', 'Not yet — the current build uses a fixed development OTP so the whole flow can be tested end to end. A live SMS/OTP gateway is one of the pieces called out as needed before real use.']
];

export default function FAQ() {
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="FAQ" description="Straight answers about financing limits, loan terms, warehouse receipts, Demo Mode, and how KisanUnnatti actually works." />
      <p className="pub-eyebrow">Frequently Asked Questions</p>
      <h1 className="pub-h1" style={{ maxWidth: '18ch' }}>Straight answers about how this actually works</h1>
      <div style={{ marginTop: '2rem' }}>
        {FAQS.map(([q, a], i) => (
          <div className="faq-item" key={i}>
            <p className="faq-q"><span className="faq-q-mark">Q.</span> {q}</p>
            <p className="faq-a">{a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
