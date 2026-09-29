import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, StatusBadge, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function FinancerLoans() {
  const { participant } = useParticipantAuth();
  const [loans, setLoans] = useState(null);
  const [exposures, setExposures] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.financerLoans(participant.id).then(async l => {
      setLoans(l);
      const active = l.filter(x => x.status === 'ACTIVE');
      const results = {};
      for (const loan of active) {
        try { results[loan.id] = await api.loanExposure(loan.id); } catch { /* ignore */ }
      }
      setExposures(results);
    }).catch(err => { setError(err.message); setLoans([]); });
  }, []);

  return (
    <div>
      <PageHeader title="Active Loans" subtitle="Principal, accrued interest, storage charges and risk ceiling utilisation for every loan you've disbursed." />
      {error && <div className="error-banner">{error}</div>}

      {!loans ? <LoadingSkeleton rows={3} /> : loans.length === 0 ? (
        <EmptyState title="No loans yet" description="Loans appear here once a farmer selects your offer and you disburse it." />
      ) : loans.map(loan => {
        const exp = exposures[loan.id];
        return (
          <Card key={loan.id}>
            <div className="ledger-row">
              <span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Loan {loan.loanRef}</span>
              <StatusBadge status={exp?.status || loan.status} />
            </div>
            <div className="ledger-row"><span className="ledger-label">Principal</span><span className="ledger-value">₹{loan.principal.toLocaleString('en-IN')}</span></div>
            <div className="ledger-row"><span className="ledger-label">Interest rate</span><span className="ledger-value">{loan.interestRatePct}% p.a.</span></div>
            <div className="ledger-row"><span className="ledger-label">Disbursed</span><span className="ledger-value">{loan.disbursementDate}</span></div>
            <div className="ledger-row"><span className="ledger-label">Maturity</span><span className="ledger-value">{loan.maturityDate}</span></div>
            {exp && <>
              <div className="ledger-row"><span className="ledger-label">Accrued interest</span><span className="ledger-value">₹{exp.accruedInterest.toLocaleString('en-IN')}</span></div>
              <div className="ledger-row"><span className="ledger-label">Storage charges</span><span className="ledger-value">₹{exp.storageCharges.toLocaleString('en-IN')}</span></div>
              <div className="ledger-row"><span className="ledger-label">Total exposure</span><span className="ledger-value">₹{exp.totalExposure.toLocaleString('en-IN')} / ceiling ₹{exp.ceiling.toLocaleString('en-IN')} ({exp.utilisationPct}%)</span></div>
            </>}
          </Card>
        );
      })}
    </div>
  );
}
