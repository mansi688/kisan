import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { PageHeader, EmptyState } from '../components/ui.jsx';

export default function Settlements() {
  const { farmer } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.settlementsForFarmer(farmer.farmerId).then(setSettlements).catch(err => setError(err.message));
  }, []);

  return (
    <div>
      <PageHeader title="Settlement History" subtitle="Every closed sale, with the full principal → interest → storage → charges → balance waterfall." />
      {error && <div className="error-banner">{error}</div>}

      {settlements.length === 0 ? (
        <EmptyState title="No settlements yet" description="Once a sale closes and escrow releases funds, the settlement statement appears here." />
      ) : settlements.map(s => (
        <div className="ledger-card" key={s.id}>
          <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.settlementRef}</span><span className="ledger-value">{new Date(s.settledAt).toLocaleDateString('en-IN')}</span></div>
          {s.steps.map((step, i) => (
            <div className="ledger-row" key={i}>
              <span className="ledger-label">{step.step}</span>
              <span className="ledger-value">{step.amount >= 0 ? '+' : ''}₹{step.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="ledger-row"><span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Farmer payable</span><span className="ledger-value" style={{ fontWeight: 600 }}>₹{s.farmerPayable.toLocaleString('en-IN')}</span></div>
        </div>
      ))}
    </div>
  );
}
