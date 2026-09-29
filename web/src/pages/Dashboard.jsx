import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { PageHeader, MetricCard, StatusBadge, EmptyState, LoadingSkeleton, BarChart, QuickAction } from '../components/ui.jsx';
import { ReceiptIcon, FinanceIcon, CoinsIcon, SettlementIcon, WarehouseIcon, AuctionIcon } from '../components/icons.jsx';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { farmer } = useAuth();
  const [data, setData] = useState(null);
  const [exposures, setExposures] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.farmerDashboard()
      .then(async d => {
        setData(d);
        const activeLoans = d.loans.filter(l => l.status === 'ACTIVE');
        const results = {};
        for (const loan of activeLoans) {
          try { results[loan.id] = await api.loanExposure(loan.id); } catch { /* ignore */ }
        }
        setExposures(results);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <LoadingSkeleton rows={4} />;

  const latestWr = data.warehouseReceipts[data.warehouseReceipts.length - 1];
  const activeLoans = data.loans.filter(l => l.status === 'ACTIVE');
  const totalWrValue = data.warehouseReceipts.reduce((s, w) => s + (w.valuation?.wrValue || 0), 0);
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.principal, 0);

  return (
    <div>
      <PageHeader
        title={`Namaste, ${farmer.name.split(' ')[0]}`}
        subtitle={<>Farmer ID <strong style={{ fontFamily: 'var(--font-mono)' }}>{farmer.farmerId}</strong> — here's where your commodity, WR and finance stand today.</>}
        actions={latestWr && (
          <div className="stamp">
            <div>WR</div>
            <div className="stamp-id">{latestWr.wrNumber}</div>
          </div>
        )}
      />

      <div className="grid-4">
        <MetricCard label="Total WR Value" value={inr(totalWrValue)} icon={<ReceiptIcon width={16} height={16} />} iconTone="wheat" />
        <MetricCard label="Outstanding Loan" value={inr(totalOutstanding)} icon={<FinanceIcon width={16} height={16} />} iconTone="rust" />
        <MetricCard label="Active Loans" value={activeLoans.length} icon={<CoinsIcon width={16} height={16} />} iconTone="field" />
        <MetricCard label="Settlements Closed" value={data.settlements.length} icon={<SettlementIcon width={16} height={16} />} iconTone="ink" />
      </div>

      <div className="quick-actions">
        <QuickAction to="/warehouse" icon={<WarehouseIcon width={15} height={15} />} label="Store Produce" />
        <QuickAction to="/financing" icon={<FinanceIcon width={15} height={15} />} iconTone="field" label="Get Financing" />
        <QuickAction to="/auction" icon={<AuctionIcon width={15} height={15} />} iconTone="rust" label="Sell Produce" />
      </div>

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Warehouse Receipts</h2>
      {data.warehouseReceipts.length === 0 ? (
        <EmptyState
          title="No warehouse receipts yet"
          description="Book a warehouse and complete stock intake to get your first digital WR."
          action={<a className="btn btn-wheat btn-sm" href="/warehouse">Book a warehouse</a>}
        />
      ) : (
        <div className="ledger-card">
          {data.warehouseReceipts.map(wr => (
            <div className="ledger-row" key={wr.id}>
              <span className="ledger-label">{wr.wrNumber} · {wr.commodity} · {wr.quantityMT} MT</span>
              <span className="ledger-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {inr(wr.valuation.wrValue)} <StatusBadge status={wr.status} />
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Loan & Risk Monitoring</h2>
      {activeLoans.length === 0 ? (
        <EmptyState title="No active loans" description="Once you accept a financing offer, your loan and its risk status will appear here." />
      ) : (
        <>
          <div style={{ marginBottom: '1.1rem' }}>
            <BarChart
              title="Exposure utilisation (% of risk ceiling)"
              data={activeLoans.map(l => ({ label: l.loanRef, value: exposures[l.id]?.utilisationPct ?? 0 }))}
              tone="field"
              format={(v) => `${v}%`}
            />
          </div>
          {activeLoans.map(loan => {
            const exp = exposures[loan.id];
            return (
              <div className="ledger-card" key={loan.id}>
                <div className="ledger-row">
                  <span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>Loan {loan.loanRef}</span>
                  <span className="ledger-value">{exp ? <StatusBadge status={exp.status} /> : '…'}</span>
                </div>
                <div className="ledger-row"><span className="ledger-label">Principal</span><span className="ledger-value">{inr(loan.principal)}</span></div>
                {exp && <>
                  <div className="ledger-row"><span className="ledger-label">Accrued interest</span><span className="ledger-value">{inr(exp.accruedInterest)}</span></div>
                  <div className="ledger-row"><span className="ledger-label">Storage charges</span><span className="ledger-value">{inr(exp.storageCharges)}</span></div>
                  <div className="ledger-row"><span className="ledger-label">Total exposure</span><span className="ledger-value">{inr(exp.totalExposure)} / ceiling {inr(exp.ceiling)} ({exp.utilisationPct}%)</span></div>
                  <div className="ledger-row"><span className="ledger-label">Maturity</span><span className="ledger-value">{exp.maturityDate} ({exp.daysToMaturity} days left)</span></div>
                </>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
