import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, StatusBadge, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function FinancerOffers() {
  const { participant } = useParticipantAuth();
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function load() {
    api.financerOffers(participant.id).then(setOffers).catch(err => { setError(err.message); setOffers([]); });
  }
  useEffect(() => { load(); }, []);

  async function disburse(offerId) {
    setError(''); setInfo('');
    try {
      const loan = await api.disburseOffer(offerId);
      setInfo(`Disbursed as loan ${loan.loanRef}. The WR is now lien-marked and the loan is active.`);
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="My Offers" subtitle="Every offer you've submitted, and its status through farmer selection and disbursement." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {!offers ? <LoadingSkeleton rows={3} /> : offers.length === 0 ? (
        <EmptyState title="No offers submitted yet" description="Submit an offer from the Marketplace against an unpledged WR." />
      ) : offers.map(o => (
        <Card key={o.id}>
          <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Offer for WR {o.wrId.slice(0, 8)}…</span><StatusBadge status={o.status} /></div>
          <div className="ledger-row"><span className="ledger-label">Amount</span><span className="ledger-value">₹{o.amount.toLocaleString('en-IN')}</span></div>
          <div className="ledger-row"><span className="ledger-label">Interest rate</span><span className="ledger-value">{o.interestRatePct}% p.a.</span></div>
          <div className="ledger-row"><span className="ledger-label">Tenure</span><span className="ledger-value">{o.tenureMonths} months</span></div>
          <div className="ledger-row"><span className="ledger-label">Submitted</span><span className="ledger-value">{new Date(o.submittedAt).toLocaleDateString('en-IN')}</span></div>
          {o.status === 'SELECTED' && (
            <div style={{ marginTop: '0.8rem' }}>
              <button className="btn btn-wheat" onClick={() => disburse(o.id)}>Approve & disburse</button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
