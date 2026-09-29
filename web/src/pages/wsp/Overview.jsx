import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, MetricCard, LoadingSkeleton, QuickAction, BarChart } from '../../components/ui.jsx';
import { WarehouseIcon, ReceiptIcon, ClipboardCheckIcon, CoinsIcon } from '../../components/icons.jsx';

/** Warehouses this operator manages — matched on wspCmName === their orgName (falls back to all, defensively). */
function myWarehouses(all, participant) {
  const mine = all.filter(w => w.wspCmName === participant.orgName);
  return mine.length ? mine : all;
}

export default function WspOverview() {
  const { participant } = useParticipantAuth();
  const [warehouses, setWarehouses] = useState(null);
  const [pendingIntakes, setPendingIntakes] = useState(null);
  const [bookingsCount, setBookingsCount] = useState(null);
  const [wrCount, setWrCount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.warehousesAll().then(async all => {
      const mine = myWarehouses(all, participant);
      setWarehouses(mine);

      const [pending, allWr, ...bookingLists] = await Promise.all([
        api.stockIntakes({ status: 'PENDING_MAKER_CHECKER' }),
        api.warehouseReceiptsAll(),
        ...mine.map(w => api.warehouseBookings(w.id))
      ]);
      const myIds = new Set(mine.map(w => w.id));
      setPendingIntakes(pending.filter(i => myIds.has(i.warehouseId)));
      setWrCount(allWr.filter(w => myIds.has(w.warehouseId)).length);
      setBookingsCount(bookingLists.reduce((s, b) => s + b.length, 0));
    }).catch(err => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!warehouses) return <LoadingSkeleton rows={4} />;

  const totalCapacity = warehouses.reduce((s, w) => s + w.capacityMT, 0);
  const availableCapacity = warehouses.reduce((s, w) => s + w.availableCapacityMT, 0);
  const occupied = totalCapacity - availableCapacity;
  const utilPct = totalCapacity ? Math.round((occupied / totalCapacity) * 100) : 0;

  return (
    <div>
      <PageHeader title={`Welcome, ${participant.name.split(' ')[0]}`} subtitle={`${participant.orgName} — warehouse capacity and stock intake at a glance.`} />

      <div className="grid-4">
        <MetricCard label="Total Capacity" value={`${totalCapacity.toLocaleString('en-IN')} MT`} icon={<WarehouseIcon width={16} height={16} />} iconTone="wheat" />
        <MetricCard label="Occupied" value={`${occupied.toLocaleString('en-IN')} MT`} icon={<CoinsIcon width={16} height={16} />} iconTone="field" trend={`${utilPct}% utilised`} trendDir={utilPct > 80 ? 'down' : 'flat'} />
        <MetricCard label="Pending Stock Intake" value={pendingIntakes?.length ?? '…'} icon={<ClipboardCheckIcon width={16} height={16} />} iconTone="rust" />
        <MetricCard label="Active WRs" value={wrCount ?? '…'} icon={<ReceiptIcon width={16} height={16} />} iconTone="ink" />
      </div>

      <div className="quick-actions">
        <QuickAction to="/wsp/bookings" icon={<WarehouseIcon width={15} height={15} />} label="Bookings" />
        <QuickAction to="/wsp/stock-intake" icon={<ReceiptIcon width={15} height={15} />} iconTone="field" label="Record Stock Intake" />
        <QuickAction to="/wsp/approvals" icon={<ClipboardCheckIcon width={15} height={15} />} iconTone="rust" label="Approvals" />
      </div>

      <BarChart
        title="Capacity utilisation by warehouse (MT occupied)"
        data={warehouses.map(w => ({ label: w.name, value: w.capacityMT - w.availableCapacityMT }))}
        tone="wheat"
        format={(v) => `${v} MT`}
      />
    </div>
  );
}
