import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import Seo from '../../components/Seo.jsx';

export default function Market() {
  const [auctions, setAuctions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auctionsOpen().then(setAuctions).catch(err => setError(err.message));
  }, []);

  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="Market" description="Live price discovery on KisanUnnatti — the actual highest valid bid on lots currently open for auction, not a static price list." />
      <p className="pub-eyebrow">Market</p>
      <h1 className="pub-h1" style={{ maxWidth: '20ch' }}>Live price discovery, not a static price list</h1>
      <p className="pub-lede">
        Prices here aren't published rates — they're the actual highest valid bid on lots currently
        open for auction on the platform. Sign in to see the full breakdown (bids, exposure, estimated
        net proceeds) for any lot tied to your account.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {!auctions ? null : auctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No lots are open for bidding right now</div>
          <p className="empty-state-desc">Open lots appear here as soon as a pledged warehouse receipt goes to auction.</p>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: '1.5rem' }}>
          <table>
            <thead><tr><th>Lot</th><th>Commodity</th><th>Quantity</th><th>Status</th></tr></thead>
            <tbody>
              {auctions.map(a => (
                <tr key={a.id}>
                  <td>{a.auctionId}</td>
                  <td>{a.commodity}</td>
                  <td>{a.quantityMT} MT</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pub-body" style={{ marginTop: '2rem' }}>
        <h3>How a price actually gets set</h3>
        <p>
          Registered processors submit bids within a defined window for a lot. The highest valid bid
          (H1) is what the farmer sees, alongside their outstanding loan exposure, before deciding
          whether to accept, negotiate, or wait for the next window.
        </p>
      </div>
      <Link to="/register" className="btn btn-wheat">Register to see full lot details</Link>
    </section>
  );
}
