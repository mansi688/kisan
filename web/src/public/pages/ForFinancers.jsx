import React from 'react';
import AudiencePage from './AudiencePage.jsx';

export default function ForFinancers() {
  return (
    <AudiencePage
      eyebrow="For Financers"
      title="Lend against verified, insured collateral you can actually monitor"
      lede="Every loan is backed by a digital warehouse receipt with a documented valuation, and every day's exposure is computed the same way for every loan in your book."
      points={[
        ['What\u2019s the collateral?', 'A digital warehouse receipt: eligible quantity from verified stock intake, times an approved market rate with its source and timestamp on record.'],
        ['How is my exposure calculated?', 'Principal plus daily-accrued interest plus storage charges plus any approved charges — recomputed against the WR\u2019s original value every time you check, not just at disbursement.'],
        ['What stops duplicate financing?', 'A WR\u2019s lien status is checked server-side before any offer or disbursement — once pledged, it can\u2019t be offered against again until the loan closes.'],
        ['How do I price competitively?', 'Farmers rank offers by effective total cost. Your amount, rate, processing fee and other charges all factor into where you land in that comparison.'],
        ['What happens at sale?', 'Once the farmer accepts a bid, the settlement waterfall recovers your principal and accrued interest first, before storage charges and any farmer payable — in that order, every time.']
      ]}
      ctaText="Register as a Financer"
      ctaTo="/financer/register"
    />
  );
}
