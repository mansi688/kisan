import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, StatusBadge, LoadingSkeleton } from '../../components/ui.jsx';

function myWarehouses(all, participant) {
  const mine = all.filter(w => w.wspCmName === participant.orgName);
  return mine.length ? mine : all;
}

export default function WspBookings() {
  const { participant } = useParticipantAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.warehousesAll().then(async all => {
      const mine = myWarehouses(all, participant);
      const byWarehouse = await Promise.all(mine.map(w => api.warehouseBookings(w.id)));
      const flat = mine.flatMap((w, i) => byWarehouse[i].map(b => ({ ...b, warehouseName: w.name })));
      flat.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRows(flat);
    }).catch(err => { setError(err.message); setRows([]); });
  }, []);

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Farmer warehouse-space bookings across your warehouses, most recent first." />
      {error && <div className="error-banner">{error}</div>}

      {!rows ? <LoadingSkeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState title="No bookings yet" description="Bookings farmers make against your warehouses will appear here." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Warehouse</th><th>Commodity</th><th>Est. Qty (MT)</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id}>
                  <td>{b.bookingRef}</td>
                  <td>{b.warehouseName}</td>
                  <td>{b.commodity}</td>
                  <td>{b.estimatedQuantityMT}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
