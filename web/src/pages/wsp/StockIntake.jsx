import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, StatusBadge, Card } from '../../components/ui.jsx';

function myWarehouses(all, participant) {
  const mine = all.filter(w => w.wspCmName === participant.orgName);
  return mine.length ? mine : all;
}

export default function WspStockIntake() {
  const { participant } = useParticipantAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ bookingId: '', bags: '', grossWeightKg: '', tareWeightKg: '', moisturePct: '', moistureRejectPct: '', foreignMatterRejectPct: '' });

  useEffect(() => {
    api.warehousesAll().then(all => {
      const mine = myWarehouses(all, participant);
      setWarehouses(mine);
      if (mine.length) setWarehouseId(mine[0].id);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    api.warehouseBookings(warehouseId).then(b => setBookings(b.filter(x => x.status === 'CONFIRMED'))).catch(err => setError(err.message));
    api.stockIntakes({ warehouseId }).then(setRecent).catch(() => {});
  }, [warehouseId]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function submit() {
    setError(''); setInfo('');
    if (!form.bookingId || !form.bags || !form.grossWeightKg || !form.tareWeightKg) {
      setError('Booking, bags, gross weight and tare weight are required.');
      return;
    }
    try {
      const intake = await api.recordStockIntake(warehouseId, {
        bookingId: form.bookingId,
        bags: Number(form.bags),
        grossWeightKg: Number(form.grossWeightKg),
        tareWeightKg: Number(form.tareWeightKg),
        qualityParams: { moisturePct: Number(form.moisturePct || 0) },
        moistureRejectPct: Number(form.moistureRejectPct || 0),
        foreignMatterRejectPct: Number(form.foreignMatterRejectPct || 0)
      });
      setInfo(`Recorded ${intake.intakeRef} — ${intake.eligibleQuantityMT} MT eligible, status ${intake.status}.`);
      api.stockIntakes({ warehouseId }).then(setRecent).catch(() => {});
      setForm({ bookingId: '', bags: '', grossWeightKg: '', tareWeightKg: '', moisturePct: '', moistureRejectPct: '', foreignMatterRejectPct: '' });
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Stock Intake" subtitle="Record arrival: bags, gross/tare weight and quality parameters. Net eligible quantity is computed here, not on the client." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      <div className="field" style={{ maxWidth: 420 }}>
        <label>Warehouse</label>
        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <Card>
        {bookings.length === 0 ? (
          <EmptyState title="No confirmed bookings awaiting intake" description="Once a farmer books space at this warehouse, it appears here for intake." />
        ) : (
          <div className="field">
            <label>Booking</label>
            <select value={form.bookingId} onChange={e => set('bookingId', e.target.value)}>
              <option value="">Select a booking…</option>
              {bookings.map(b => <option key={b.id} value={b.id}>{b.bookingRef} — {b.commodity}, {b.estimatedQuantityMT} MT est.</option>)}
            </select>
          </div>
        )}
        <div className="grid-3">
          <div className="field"><label>Bags</label><input type="number" value={form.bags} onChange={e => set('bags', e.target.value)} /></div>
          <div className="field"><label>Gross weight (kg)</label><input type="number" value={form.grossWeightKg} onChange={e => set('grossWeightKg', e.target.value)} /></div>
          <div className="field"><label>Tare weight (kg)</label><input type="number" value={form.tareWeightKg} onChange={e => set('tareWeightKg', e.target.value)} /></div>
        </div>
        <div className="grid-3">
          <div className="field"><label>Moisture %</label><input type="number" step="0.1" value={form.moisturePct} onChange={e => set('moisturePct', e.target.value)} /></div>
          <div className="field"><label>Moisture reject %</label><input type="number" step="0.1" value={form.moistureRejectPct} onChange={e => set('moistureRejectPct', e.target.value)} /></div>
          <div className="field"><label>Foreign matter reject %</label><input type="number" step="0.1" value={form.foreignMatterRejectPct} onChange={e => set('foreignMatterRejectPct', e.target.value)} /></div>
        </div>
        <button className="btn btn-wheat" onClick={submit} disabled={bookings.length === 0}>Record intake</button>
      </Card>

      <h2 className="section-title" style={{ fontSize: '1.1rem', marginTop: '2rem' }}>Recent Intakes — this warehouse</h2>
      {recent.length === 0 ? <EmptyState title="No intakes yet" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Net (kg)</th><th>Eligible (MT)</th><th>Reject %</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(i => (
                <tr key={i.id}><td>{i.intakeRef}</td><td>{i.netWeightKg}</td><td>{i.eligibleQuantityMT}</td><td>{i.totalRejectPct}%</td><td><StatusBadge status={i.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
