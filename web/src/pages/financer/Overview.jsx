import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, MetricCard, LoadingSkeleton, QuickAction, BarChart } from '../../components/ui.jsx';
import { CoinsIcon, FinanceIcon, ReceiptIcon, WarehouseIcon } from '../../components/icons.jsx';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function FinancerOverview() {
  const { participant } = useParticipantAuth();
  const [offers, setOffers] = useState(null);
  const [loans, setLoans] = useState(null);
  const [exposures, setExposures] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.financerOffers(participant.id),
      api.financerLoans(participant.id)
    ]).then(async ([o, l]) => {
      setOffers(o);
      setLoans(l);
      const active = l.filter(x => x.status === 'ACTIVE');
      const results = {};
      for (const loan of active) {
        try { results[loan.id] = await api.loanExposure(loan.id); } catch { /* ignore */ }
      }
      setExposures(results);
    }).catch(err => setError(err.message));
  }, [participant.id]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!offers || !loans) return <LoadingSkeleton rows={4} />;

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalDisbursed = loans.reduce((s, l) => s + l.principal, 0);
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.principal, 0);
  const atRisk = activeLoans.filter(l => exposures[l.id]?.status === 'RED' || exposures[l.id]?.status === 'AMBER').length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${participant.name.split(' ')[0]}`}
        subtitle={<>{participant.orgName} — your financing portfolio at a glance.</>}
      />

      <div className="grid-4">
        <MetricCard label="Total Disbursed" value={inr(totalDisbursed)} icon={<CoinsIcon width={16} height={16} />} iconTone="wheat" />
        <MetricCard label="Outstanding Principal" value={inr(totalOutstanding)} icon={<FinanceIcon width={16} height={16} />} iconTone="rust" />
        <MetricCard label="Active Loans" value={activeLoans.length} icon={<ReceiptIcon width={16} height={16} />} iconTone="field" />
        <MetricCard label="At-Risk Exposure" value={atRisk} icon={<WarehouseIcon width={16} height={16} />} iconTone="ink" trend={atRisk > 0 ? `${atRisk} loan(s) amber/red` : undefined} trendDir={atRisk > 0 ? 'down' : 'flat'} />
      </div>

      <div className="quick-actions">
        <QuickAction to="/financer/marketplace" icon={<WarehouseIcon width={15} height={15} />} label="Browse Marketplace" />
        <QuickAction to="/financer/offers" icon={<ReceiptIcon width={15} height={15} />} iconTone="field" label="My Offers" />
        <QuickAction to="/financer/loans" icon={<CoinsIcon width={15} height={15} />} iconTone="rust" label="Active Loans" />
      </div>

      {activeLoans.length > 0 && (
        <BarChart
          title="Exposure utilisation by loan (% of risk ceiling)"
          data={activeLoans.map(l => ({ label: l.loanRef, value: exposures[l.id]?.utilisationPct ?? 0 }))}
          tone="field"
          format={(v) => `${v}%`}
        />
      )}
    </div>
  );
}
