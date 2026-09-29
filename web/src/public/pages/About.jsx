import React from 'react';
import Seo from '../../components/Seo.jsx';

export default function About() {
  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="About" description="What KisanUnnatti is, the problem it solves, and how the farmer, financer and warehouse ecosystem fits together." />
      <p className="pub-eyebrow">About KisanUnnatti</p>
      <h1 className="pub-h1" style={{ maxWidth: '20ch' }}>A digital bridge between the harvest and the market</h1>
      <div className="pub-body">
        <p>
          A farmer's produce is often worth the most money right after harvest, and the least right
          when they need cash the most — because that's when everyone is selling. KisanUnnatti exists
          to break that link: store the produce in an insured warehouse, get a digital warehouse
          receipt for its value, borrow against that receipt, and choose when to sell once the market
          has recovered.
        </p>
        <h3>What KisanUnnatti actually does</h3>
        <p>
          It connects four kinds of participants around one shared record of truth: farmers who store
          and eventually sell their commodity; warehouse operators (WSP/CM) who verify what's actually
          in storage and issue the digital receipt; financers who lend against that receipt; and
          processors who bid for the commodity when it's ready for sale. Every step — booking,
          intake, valuation, financing, exposure monitoring, bidding, settlement — happens through the
          same platform, so nobody is working from a different version of the truth.
        </p>
        <h3>Server-enforced, not just server-hosted</h3>
        <p>
          The financing cap, the loan tenure rule, the risk ceiling and the settlement waterfall are
          not guidelines shown in a UI — they're functions in one backend module, called by every
          client (web and mobile) and enforced the same way regardless of which one a person happens
          to be using. A reviewer can check the code against the rules line by line.
        </p>
        <h3>Where this stands today</h3>
        <p>
          This is a working platform covering the full farmer journey, plus dedicated portals for
          financers, warehouse operators and admins. Real production requirements — a live OTP/SMS
          gateway, a payments/escrow integration, and an independent legal and compliance review —
          are called out explicitly in the project's own documentation rather than glossed over.
        </p>
      </div>
    </section>
  );
}
