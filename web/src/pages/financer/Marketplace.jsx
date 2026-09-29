import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function FinancerMarketplace() {
  const [receipts, setReceipts] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [formByWr, setFormByWr] = useState({});

  function loadReceipts() {
    api.freeWarehouseReceipts().then(setReceipts).catch(err => { setError(err.message); setReceipts([]); });
  }
  useEffect(() => { loadReceipts(); }, []);

  function setField(wrId, field, value) {
    setFormByWr(prev => ({ ...prev, [wrId]: { ...prev[wrId], [field]: value } }));
  }

  async function submit(wrId) {
    setError(''); setInfo('');
    const f = formByWr[wrId] || {};
    if (!f.interestRatePct || !f.tenureMonths) {
      setError('Enter an interest rate and tenure before submitting an offer.');
      return;
    }
    try {
      await api.submitFinancingOffer({
        wrId,
        interestRatePct: Number(f.interestRatePct),
        processingFee: Number(f.processingFee || 0),
        otherCharges: Number(f.otherCharges || 0),
        tenureMonths: Number(f.tenureMonths),
        conditions: f.conditions || ''
      });
      setInfo('Offer submitted — it will appear in the farmer\u2019s financing marketplace.');
      loadReceipts();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Financing Marketplace" subtitle="Unpledged warehouse receipts open for financing offers, up to the 75% eligibility cap." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {!receipts ? <LoadingSkeleton rows={3} /> : receipts.length === 0 ? (
        <EmptyState title="No unpledged WRs right now" description="New warehouse receipts issued by WSP/CM operators will appear here as they become eligible for financing." />
      ) : (
        <div className="grid-2">
          {receipts.map(wr => {
            const f = formByWr[wr.id] || {};
            return (
              <Card key={wr.id}>
                <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{wr.wrNumber}</span><span className="ledger-value">{wr.commodity}</span></div>
                <div className="ledger-row"><span className="ledger-label">Quantity</span><span className="ledger-value">{wr.quantityMT} MT</span></div>
                <div className="ledger-row"><span className="ledger-label">WR Value</span><span className="ledger-value">₹{wr.valuation.wrValue.toLocaleString('en-IN')}</span></div>
                <div className="ledger-row"><span className="ledger-label">Max eligible (75%)</span><span className="ledger-value">₹{Math.round(wr.valuation.wrValue * 0.75).toLocaleString('en-IN')}</span></div>
                <div className="grid-2" style={{ marginTop: '0.8rem' }}>
                  <div className="field"><label>Interest rate % p.a.</label><input type="number" step="0.1" value={f.interestRatePct || ''} onChange={e => setField(wr.id, 'interestRatePct', e.target.value)} /></div>
                  <div className="field"><label>Tenure (months, max 9)</label><input type="number" max={9} value={f.tenureMonths || ''} onChange={e => setField(wr.id, 'tenureMonths', e.target.value)} /></div>
                  <div className="field"><label>Processing fee ₹</label><input type="number" value={f.processingFee || ''} onChange={e => setField(wr.id, 'processingFee', e.target.value)} /></div>
                  <div className="field"><label>Other charges ₹</label><input type="number" value={f.otherCharges || ''} onChange={e => setField(wr.id, 'otherCharges', e.target.value)} /></div>
                </div>
                <div className="field"><label>Conditions (optional)</label><input value={f.conditions || ''} onChange={e => setField(wr.id, 'conditions', e.target.value)} /></div>
                <button className="btn btn-wheat" onClick={() => submit(wr.id)}>Submit offer</button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
