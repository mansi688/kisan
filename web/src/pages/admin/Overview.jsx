import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, MetricCard, LoadingSkeleton, QuickAction } from '../../components/ui.jsx';
import { UsersIcon, ReceiptIcon, CoinsIcon, AuctionIcon, WarehouseIcon, ClipboardCheckIcon, HistoryIcon } from '../../components/icons.jsx';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminOverview() {
  const { participant } = useParticipantAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.portfolio().then(setData).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <LoadingSkeleton rows={4} />;

  return (
    <div>
      <PageHeader title={`Welcome, ${participant.name.split(' ')[0]}`} subtitle="Platform-wide portfolio, in real time." />

      <div className="grid-4">
        <MetricCard label="Farmers" value={data.farmerCount} icon={<UsersIcon width={16} height={16} />} iconTone="wheat" />
        <MetricCard label="Warehouse Receipts" value={data.wrCount} icon={<ReceiptIcon width={16} height={16} />} iconTone="field" />
        <MetricCard label="Total WR Value" value={inr(data.totalWrValue)} icon={<CoinsIcon width={16} height={16} />} iconTone="ink" />
        <MetricCard label="Active Loans" value={data.activeLoanCount} icon={<CoinsIcon width={16} height={16} />} iconTone="rust" trend={`${inr(data.totalOutstanding)} outstanding`} trendDir="flat" />
      </div>
      <div className="grid-3" style={{ marginTop: '1.1rem' }}>
        <MetricCard label="Avg. Interest Rate" value={`${data.averageInterestRatePct}%`} icon={<CoinsIcon width={16} height={16} />} iconTone="wheat" />
        <MetricCard label="Auctions" value={data.auctionCount} icon={<AuctionIcon width={16} height={16} />} iconTone="field" />
        <MetricCard label="Settlements" value={data.settlementCount} icon={<ReceiptIcon width={16} height={16} />} iconTone="ink" />
      </div>

      <div className="quick-actions">
        <QuickAction to="/admin/warehouses" icon={<WarehouseIcon width={15} height={15} />} label="Warehouses" />
        <QuickAction to="/admin/auctions" icon={<AuctionIcon width={15} height={15} />} iconTone="field" label="Auctions" />
        <QuickAction to="/admin/settlements" icon={<ReceiptIcon width={15} height={15} />} iconTone="rust" label="Settlements" />
        <QuickAction to="/admin/approvals" icon={<ClipboardCheckIcon width={15} height={15} />} iconTone="ink" label="Approvals" />
        <QuickAction to="/admin/audit-log" icon={<HistoryIcon width={15} height={15} />} iconTone="wheat" label="Audit Log" />
      </div>
    </div>
  );
}
