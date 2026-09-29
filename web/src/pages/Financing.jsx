import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, EmptyState, StatusBadge } from '../components/ui.jsx';

export default function Financing() {
  const [receipts, setReceipts] = useState([]);
  const [selectedWr, setSelectedWr] = useState('');
  const [offers, setOffers] = useState([]);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    api.farmerDashboard().then(d => {
      const free = d.warehouseReceipts.filter(w => w.status === 'ACTIVE');
      setReceipts(free);
      if (free.length) setSelectedWr(free[0].id);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedWr) return;
    api.offersForWr(selectedWr).then(setOffers).catch(err => setError(err.message));
  }, [selectedWr]);

  async function select(offerId) {
    setError(''); setInfo('');
    try {
      await api.selectOffer(offerId, otp);
      setInfo('Offer confirmed with digital consent. Your financer will now review and disburse.');
      setOffers(await api.offersForWr(selectedWr));
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Financing Marketplace" subtitle="Compare offers from registered financers side by side, ranked by effective total cost, not just nominal rate." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {receipts.length === 0 ? (
        <EmptyState title="No unpledged WR available" description="Issue a warehouse receipt first via your WSP/CM before applying for financing." />
      ) : (
        <div className="field" style={{ maxWidth: 420 }}>
          <label>Select WR</label>
          <select value={selectedWr} onChange={e => setSelectedWr(e.target.value)}>
            {receipts.map(w => <option key={w.id} value={w.id}>{w.wrNumber} — {w.commodity}, ₹{w.valuation.wrValue.toLocaleString('en-IN')}</option>)}
          </select>
        </div>
      )}

      {offers.length === 0 ? (
        <EmptyState title="No offers yet" description="Once financers submit offers against this WR, you'll be able to compare them here." />
      ) : (
        <div className="grid-2">
          {offers.map(o => (
            <div className="ledger-card" key={o.id}>
              <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Offer</span><StatusBadge status={o.status} /></div>
              <div className="ledger-row"><span className="ledger-label">Amount</span><span className="ledger-value">₹{o.amount.toLocaleString('en-IN')}</span></div>
              <div className="ledger-row"><span className="ledger-label">Interest rate</span><span className="ledger-value">{o.interestRatePct}% p.a.</span></div>
              <div className="ledger-row"><span className="ledger-label">Processing fee</span><span className="ledger-value">₹{o.processingFee}</span></div>
              <div className="ledger-row"><span className="ledger-label">Other charges</span><span className="ledger-value">₹{o.otherCharges}</span></div>
              <div className="ledger-row"><span className="ledger-label">Tenure</span><span className="ledger-value">{o.tenureMonths} months</span></div>
              {o.status === 'SUBMITTED' && (
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input placeholder="OTP (dev: 123456)" style={{ maxWidth: 180 }} value={otp} onChange={e => setOtp(e.target.value)} />
                  <button className="btn btn-wheat" onClick={() => select(o.id)}>Confirm with OTP</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
