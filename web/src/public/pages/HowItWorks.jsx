import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';

const STAGES = [
  ['Registration & KYC', 'Verify your mobile number with OTP, then complete your profile: Aadhaar and PAN details, bank account, and location. This creates your unique Farmer ID.'],
  ['Warehouse booking', 'Search insured warehouses by commodity and district, check available capacity and per-day storage charges, and book your space.'],
  ['Stock intake', 'When your produce arrives, the warehouse operator records bags, gross and tare weight, and quality parameters (moisture, foreign matter). Net eligible quantity is computed automatically — any unusual reject percentage is held for a second sign-off before it goes further.'],
  ['Digital warehouse receipt (WR)', 'Once intake is verified, the operator issues a WR: eligible quantity × the approved market rate, with the rate source and valuation timestamp recorded. This is your commodity\u2019s value, unlocked as a digital record.'],
  ['Financing marketplace', 'Registered financers see your WR and submit offers — amount, interest rate, processing fee, tenure. Offers are ranked by effective total cost, not just the headline rate, so the cheapest-looking offer isn\u2019t necessarily the best one.'],
  ['Digital consent & disbursement', 'You confirm your chosen offer with an OTP. The financer then approves and disburses — at which point your WR is lien-marked so it can\u2019t be pledged twice.'],
  ['Loan monitoring', 'Interest and storage charges accrue daily. Your dashboard shows total exposure against a 90% risk ceiling (of the WR\u2019s original value) in green/amber/red, so you always know where you stand.'],
  ['Market & auction', 'When you\u2019re ready to sell, your pledged lot goes to auction. Registered processors bid within a defined window; you see the highest valid bid (H1) and your estimated net proceeds before deciding.'],
  ['Farmer decision', 'Accept the H1 bid, ask to negotiate, or wait and watch — your lot keeps accruing interest and storage charges either way, so the numbers stay current.'],
  ['Escrow & settlement', 'Once you accept, sale proceeds are confirmed into escrow and the settlement waterfall runs in order: principal, then accrued interest, then storage charges, then any other approved charges — with the remainder as your payable amount.'],
  ['Payment', 'The lien is released, the WR closes, and your settlement statement — the full waterfall, line by line — is available in your account.']
];

export default function HowItWorks() {
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="How It Works" description="Register, store, get a warehouse receipt, finance it, monitor exposure, and sell at auction — the real KisanUnnatti workflow, stage by stage." />
      <p className="pub-eyebrow">How It Works</p>
      <h1 className="pub-h1" style={{ maxWidth: '22ch' }}>Register → Store → WR → Finance → Monitor → Auction → Sell → Settle</h1>
      <p className="pub-lede">Every stage below is a real screen in the app, backed by a rule enforced on the server — not a diagram of an idea.</p>
      <div className="step-list">
        {STAGES.map(([title, desc], i) => (
          <div className="step-item" key={i}>
            <div className="step-num" />
            <div>
              <p className="step-title">{title}</p>
              <p className="step-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '2.5rem' }}>
        <Link to="/register" className="btn btn-wheat">Start with registration</Link>
      </div>
    </section>
  );
}
