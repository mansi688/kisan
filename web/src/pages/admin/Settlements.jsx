import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminSettlements() {
  const [accepted, setAccepted] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function load() {
    api.allAuctions('ACCEPTED').then(setAccepted).catch(err => { setError(err.message); setAccepted([]); });
  }
  useEffect(() => { load(); }, []);

  async function settle(auctionId) {
    setError(''); setInfo('');
    try {
      const s = await api.settleAuction(auctionId);
      setInfo(`Settled ${s.settlementRef} — farmer payable ₹${s.farmerPayable.toLocaleString('en-IN')}.`);
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Settlements" subtitle="Auctions the farmer has accepted (H1), awaiting escrow settlement. Settling runs the full principal → interest → storage → charges waterfall server-side." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {!accepted ? <LoadingSkeleton rows={3} /> : accepted.length === 0 ? (
        <EmptyState title="Nothing awaiting settlement" description="Auctions appear here once a farmer accepts the H1 bid." />
      ) : accepted.map(a => (
        <Card key={a.id}>
          <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.auctionId}</span><span className="ledger-value">{a.commodity} — {a.quantityMT} MT</span></div>
          <button className="btn btn-wheat" style={{ marginTop: '0.6rem' }} onClick={() => settle(a.id)}>Confirm escrow & settle</button>
        </Card>
      ))}
    </div>
  );
}
