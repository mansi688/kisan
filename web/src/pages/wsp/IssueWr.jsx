import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, Card } from '../../components/ui.jsx';

function myWarehouses(all, participant) {
  const mine = all.filter(w => w.wspCmName === participant.orgName);
  return mine.length ? mine : all;
}

export default function WspIssueWr() {
  const { participant } = useParticipantAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [eligibleIntakes, setEligibleIntakes] = useState([]);
  const [bookingByIntake, setBookingByIntake] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ intakeId: '', grade: '', marketRatePerMT: '', rateSource: '', insuranceRef: '' });

  useEffect(() => {
    api.warehousesAll().then(all => {
      const mine = myWarehouses(all, participant);
      setWarehouses(mine);
      if (mine.length) setWarehouseId(mine[0].id);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    Promise.all([
      api.stockIntakes({ warehouseId, status: 'VERIFIED' }),
      api.warehouseReceiptsAll(),
      api.warehouseBookings(warehouseId)
    ]).then(([intakes, allWr, bookings]) => {
      const alreadyIssued = new Set(allWr.map(w => w.stockIntakeId));
      setEligibleIntakes(intakes.filter(i => !alreadyIssued.has(i.id)));
      const map = {};
      bookings.forEach(b => { map[b.id] = b; });
      setBookingByIntake(intakes.reduce((acc, i) => { acc[i.id] = map[i.bookingId]; return acc; }, {}));
    }).catch(err => setError(err.message));
  }, [warehouseId]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  const selectedIntake = eligibleIntakes.find(i => i.id === form.intakeId);
  const selectedBooking = form.intakeId ? bookingByIntake[form.intakeId] : null;

  async function submit() {
    setError(''); setInfo('');
    if (!selectedIntake || !selectedBooking) { setError('Select a verified stock intake first.'); return; }
    if (!form.marketRatePerMT || !form.rateSource) { setError('Market rate and rate source are required.'); return; }
    try {
      const wr = await api.issueWr({
        stockIntakeId: selectedIntake.id,
        farmerId: selectedBooking.farmerId,
        warehouseId,
        commodity: selectedBooking.commodity,
        grade: form.grade,
        marketRatePerMT: Number(form.marketRatePerMT),
        rateSource: form.rateSource,
        insuranceRef: form.insuranceRef || null
      });
      setInfo(`Issued ${wr.wrNumber} — value ₹${wr.valuation.wrValue.toLocaleString('en-IN')}.`);
      setEligibleIntakes(prev => prev.filter(i => i.id !== selectedIntake.id));
      setForm({ intakeId: '', grade: '', marketRatePerMT: '', rateSource: '', insuranceRef: '' });
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Issue Digital Warehouse Receipt" subtitle="WR value is computed server-side from eligible quantity × approved market rate — never edited directly." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      <div className="field" style={{ maxWidth: 420 }}>
        <label>Warehouse</label>
        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {eligibleIntakes.length === 0 ? (
        <EmptyState title="No verified intakes awaiting a WR" description="Once stock intake is verified (and any exception approved), it becomes eligible for WR issuance here." />
      ) : (
        <Card>
          <div className="field">
            <label>Verified stock intake</label>
            <select value={form.intakeId} onChange={e => set('intakeId', e.target.value)}>
              <option value="">Select…</option>
              {eligibleIntakes.map(i => <option key={i.id} value={i.id}>{i.intakeRef} — {i.eligibleQuantityMT} MT eligible</option>)}
            </select>
          </div>
          {selectedBooking && (
            <div className="ledger-row"><span className="ledger-label">Farmer / Commodity</span><span className="ledger-value">{selectedBooking.farmerId} · {selectedBooking.commodity}</span></div>
          )}
          <div className="grid-2">
            <div className="field"><label>Grade</label><input value={form.grade} onChange={e => set('grade', e.target.value)} placeholder="FAQ" /></div>
            <div className="field"><label>Market rate ₹/MT</label><input type="number" value={form.marketRatePerMT} onChange={e => set('marketRatePerMT', e.target.value)} /></div>
          </div>
          <div className="grid-2">
            <div className="field"><label>Rate source</label><input value={form.rateSource} onChange={e => set('rateSource', e.target.value)} placeholder="APMC Nashik" /></div>
            <div className="field"><label>Insurance ref (optional)</label><input value={form.insuranceRef} onChange={e => set('insuranceRef', e.target.value)} /></div>
          </div>
          {selectedIntake && form.marketRatePerMT && (
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              Estimated WR value: <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{Math.round(selectedIntake.eligibleQuantityMT * Number(form.marketRatePerMT)).toLocaleString('en-IN')}</strong>
            </p>
          )}
          <button className="btn btn-wheat" onClick={submit}>Issue WR</button>
        </Card>
      )}
    </div>
  );
}
