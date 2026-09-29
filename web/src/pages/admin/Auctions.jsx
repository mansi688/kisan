import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, StatusBadge, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminAuctions() {
  const [pledged, setPledged] = useState(null);
  const [auctions, setAuctions] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ wrId: '', windowOpensAt: '', windowClosesAt: '' });

  function load() {
    api.pledgedWarehouseReceipts().then(setPledged).catch(err => { setError(err.message); setPledged([]); });
    api.allAuctions().then(a => setAuctions(a.slice().reverse())).catch(err => { setError(err.message); setAuctions([]); });
  }
  useEffect(() => { load(); }, []);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function openAuction() {
    setError(''); setInfo('');
    if (!form.wrId || !form.windowOpensAt || !form.windowClosesAt) { setError('Select a WR and both window times.'); return; }
    try {
      const a = await api.openAuction({
        wrId: form.wrId,
        windowOpensAt: new Date(form.windowOpensAt).toISOString(),
        windowClosesAt: new Date(form.windowClosesAt).toISOString()
      });
      setInfo(`Auction ${a.auctionId} opened.`);
      setForm({ wrId: '', windowOpensAt: '', windowClosesAt: '' });
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Auction Management" subtitle="Open a bidding window on a pledged WR, then track lots through to farmer decision." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      <Card>
        {!pledged ? <LoadingSkeleton rows={2} /> : pledged.length === 0 ? (
          <EmptyState title="No pledged WRs available" description="A WR becomes eligible for auction once a financing offer against it has been disbursed." />
        ) : (
          <>
            <div className="field">
              <label>Pledged WR</label>
              <select value={form.wrId} onChange={e => set('wrId', e.target.value)}>
                <option value="">Select…</option>
                {pledged.map(w => <option key={w.id} value={w.id}>{w.wrNumber} — {w.commodity}, {w.quantityMT} MT</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="field"><label>Window opens</label><input type="datetime-local" value={form.windowOpensAt} onChange={e => set('windowOpensAt', e.target.value)} /></div>
              <div className="field"><label>Window closes</label><input type="datetime-local" value={form.windowClosesAt} onChange={e => set('windowClosesAt', e.target.value)} /></div>
            </div>
            <button className="btn btn-wheat" onClick={openAuction}>Open auction</button>
          </>
        )}
      </Card>

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginTop: '2rem' }}>All Lots</h2>
      {!auctions ? <LoadingSkeleton rows={3} /> : auctions.length === 0 ? <EmptyState title="No auction lots yet" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Auction ID</th><th>Commodity</th><th>Qty (MT)</th><th>Status</th></tr></thead>
            <tbody>
              {auctions.map(a => (
                <tr key={a.id}><td>{a.auctionId}</td><td>{a.commodity}</td><td>{a.quantityMT}</td><td><StatusBadge status={a.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
