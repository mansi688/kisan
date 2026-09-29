import React from 'react';
import AudiencePage from './AudiencePage.jsx';

export default function ForFarmers() {
  return (
    <AudiencePage
      eyebrow="For Farmers"
      title="Get a loan against your stored produce, on your terms"
      lede="Store your commodity in an insured warehouse and unlock up to 75% of its value as financing — without having to sell before the price is right."
      points={[
        ['How much can I borrow?', 'Up to 75% of your warehouse receipt\u2019s value — computed from your net eligible quantity times the approved market rate, not an estimate.'],
        ['How do I choose a lender?', 'Compare offers side by side, ranked by effective total cost (interest plus fees), not just the advertised rate.'],
        ['What if prices move against me?', 'Your dashboard shows total exposure — principal, accrued interest, storage charges — against a 90% risk ceiling of your WR\u2019s original value, in green/amber/red, every day.'],
        ['When do I have to sell?', 'Loans run up to 9 months, or until 31 August of the following year, whichever comes first. Before that, the decision to accept a bid, negotiate, or wait is yours.'],
        ['What do I actually see before I decide?', 'The highest valid bid, your outstanding principal and interest, storage charges to date, and your estimated net proceeds — before you commit to anything.']
      ]}
      ctaText="Register your Farmer ID"
      ctaTo="/register"
    />
  );
}
