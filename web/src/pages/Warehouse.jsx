import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHeader, EmptyState, StatusBadge } from '../components/ui.jsx';

export default function Warehouse() {
  const [commodity, setCommodity] = useState('');
  const [district, setDistrict] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [qtyByWarehouse, setQtyByWarehouse] = useState({});

  async function search() {
    setError('');
    try {
      setWarehouses(await api.searchWarehouses(commodity, district));
    } catch (err) { setError(err.message); }
  }

  async function loadBookings() {
    try { setBookings(await api.myBookings()); } catch { /* ignore */ }
  }

  useEffect(() => { search(); loadBookings(); }, []);

  async function book(warehouseId) {
    setError('');
    const estimatedQuantityMT = Number(qtyByWarehouse[warehouseId] || 0);
    if (!estimatedQuantityMT || !commodity) {
      setError('Enter a commodity in the search box above and an estimated quantity before booking.');
      return;
    }
    try {
      await api.bookWarehouse(warehouseId, { commodity, estimatedQuantityMT });
      await search();
      await loadBookings();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Warehouse Booking" subtitle="Search by commodity and district, check capacity and insurance status, then book your space." />
      {error && <div className="error-banner">{error}</div>}

      <div className="ledger-card">
        <div className="grid-2">
          <div className="field"><label>Commodity</label><input value={commodity} onChange={e => setCommodity(e.target.value)} placeholder="Soybean" /></div>
          <div className="field"><label>District</label><input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Nashik" /></div>
        </div>
        <button className="btn btn-outline" onClick={search}>Search</button>
      </div>

      {warehouses.length === 0 ? (
        <EmptyState title="No warehouses match" description="Try clearing the commodity or district filters above." />
      ) : warehouses.map(w => (
        <div className="ledger-card" key={w.id}>
          <div className="ledger-row">
            <span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{w.name}</span>
            <StatusBadge status={w.agreementApproved ? 'APPROVED' : 'PENDING'} />
          </div>
          <div className="ledger-row"><span className="ledger-label">WSP/CM</span><span className="ledger-value">{w.wspCmName}</span></div>
          <div className="ledger-row"><span className="ledger-label">Location</span><span className="ledger-value">{w.district}, {w.state}</span></div>
          <div className="ledger-row"><span className="ledger-label">Available capacity</span><span className="ledger-value">{w.availableCapacityMT} / {w.capacityMT} MT</span></div>
          <div className="ledger-row"><span className="ledger-label">Charges</span><span className="ledger-value">₹{w.chargesPerMTPerDay}/MT/day</span></div>
          <div className="ledger-row"><span className="ledger-label">Insurance valid till</span><span className="ledger-value">{w.insuranceValidTill}</span></div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="number" placeholder="Est. quantity (MT)" style={{ maxWidth: 180 }}
              value={qtyByWarehouse[w.id] || ''}
              onChange={e => setQtyByWarehouse(prev => ({ ...prev, [w.id]: e.target.value }))}
            />
            <button className="btn btn-wheat" onClick={() => book(w.id)}>Book space</button>
          </div>
        </div>
      ))}

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginTop: '2rem' }}>My Bookings</h2>
      {bookings.length === 0 ? <EmptyState title="No bookings yet" description="Bookings you make above will show up here." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Commodity</th><th>Est. Qty (MT)</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}><td>{b.bookingRef}</td><td>{b.commodity}</td><td>{b.estimatedQuantityMT}</td><td><StatusBadge status={b.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
