import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';

const TOPICS = [
  ['Getting started', 'Registering your Farmer ID, verifying your mobile number, and completing KYC.', '/for-farmers'],
  ['Storing produce', 'Searching warehouses, booking space, and what happens during stock intake.', '/how-it-works'],
  ['Financing', 'How offers are compared, what the 75% cap means, and confirming an offer with OTP.', '/for-farmers'],
  ['Monitoring your loan', 'Reading your exposure and risk status day to day.', '/for-farmers'],
  ['Selling at auction', 'How bids work, what H1 means, and your Accept/Negotiate/Wait options.', '/how-it-works'],
  ['Settlement', 'How the waterfall pays down principal, interest and charges before your payout.', '/how-it-works']
];

export default function HelpCenter() {
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="Help Center" description="Find help with getting started, login problems, and farmer, financer or warehouse account questions on KisanUnnatti." />
      <p className="pub-eyebrow">Help Center</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Find what you need</h1>
      <p className="pub-lede">Most questions are answered in How It Works or the FAQ — this page points you to the right section.</p>
      <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {TOPICS.map(([title, desc, to], i) => (
          <Link key={i} to={to} className="feature-card" style={{ textDecoration: 'none', display: 'block' }}>
            <p className="feature-title">{title}</p>
            <p className="feature-desc">{desc}</p>
          </Link>
        ))}
      </div>
      <p className="pub-body" style={{ marginTop: '2rem' }}>
        Can't find an answer? <Link to="/contact">Send us a message</Link> — it goes straight to the platform's inbox.
      </p>
    </section>
  );
}
