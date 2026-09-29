import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, EmptyState, LoadingSkeleton } from '../components/ui.jsx';

export default function Auction() {
  const [auctions, setAuctions] = useState(null);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function load() {
    try {
      const list = await api.auctionsOpen();
      setAuctions(list);
      if (list.length) setSelected(list[0].id);
    } catch (err) {
      setError(err.message);
      setAuctions([]); // stop showing the loading skeleton — the error banner already covers this
    }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) { setView(null); return; }
    api.auctionFarmerView(selected).then(setView).catch(err => setError(err.message));
  }, [selected]);

  async function decide(decision) {
    setError(''); setInfo('');
    try {
      await api.submitDecision(selected, decision);
      setInfo(`Decision recorded: ${decision.replace('_', ' ')}.`);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Auction & Price Discovery" subtitle="See the highest valid bid (H1) and your estimated net proceeds before you decide." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {!auctions ? (
        <LoadingSkeleton rows={2} />
      ) : auctions.length === 0 ? (
        <EmptyState title="No open auction lots" description="Lots become available for bidding once your commodity is listed for sale." />
      ) : (
        <div className="field" style={{ maxWidth: 420 }}>
          <label>Select auction lot</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {auctions.map(a => <option key={a.id} value={a.id}>{a.auctionId} — {a.commodity}, {a.quantityMT} MT</option>)}
          </select>
        </div>
      )}

      {view && (
        <div className="ledger-card">
          <div className="ledger-row"><span className="ledger-label">Commodity / Quantity</span><span className="ledger-value">{view.auction.commodity} — {view.auction.quantityMT} MT</span></div>
          <div className="ledger-row"><span className="ledger-label">H1 bid (highest valid bid)</span><span className="ledger-value">{view.h1 ? `₹${view.h1.pricePerMT.toLocaleString('en-IN')}/MT = ₹${view.h1.totalValue.toLocaleString('en-IN')}` : 'No bids yet'}</span></div>
          {view.breakdown && (
            <>
              <div className="ledger-row"><span className="ledger-label">Outstanding principal</span><span className="ledger-value">₹{view.breakdown.principal.toLocaleString('en-IN')}</span></div>
              <div className="ledger-row"><span className="ledger-label">Accrued interest</span><span className="ledger-value">₹{view.breakdown.accruedInterest.toLocaleString('en-IN')}</span></div>
              <div className="ledger-row"><span className="ledger-label">Storage charges</span><span className="ledger-value">₹{view.breakdown.storageCharges.toLocaleString('en-IN')}</span></div>
            </>
          )}
          <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Estimated net proceeds</span><span className="ledger-value" style={{ fontWeight: 600 }}>{view.estimatedNetProceeds != null ? `₹${view.estimatedNetProceeds.toLocaleString('en-IN')}` : '—'}</span></div>

          {view.auction.status === 'OPEN' && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-wheat" onClick={() => decide('ACCEPT_H1')}>Accept H1</button>
              <button className="btn btn-outline" onClick={() => decide('NEGOTIATE')}>Negotiate</button>
              <button className="btn btn-outline" onClick={() => decide('WAIT_AND_WATCH')}>Wait & Watch</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
