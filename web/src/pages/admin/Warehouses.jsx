import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, StatusBadge, Card, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ name: '', wspCmName: '', district: '', state: '', commodities: '', capacityMT: '', chargesPerMTPerDay: '', insuranceValidTill: '' });

  function load() { api.warehousesAll().then(setWarehouses).catch(err => { setError(err.message); setWarehouses([]); }); }
  useEffect(() => { load(); }, []);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function submit() {
    setError(''); setInfo('');
    if (!form.name || !form.capacityMT) { setError('Name and capacity are required.'); return; }
    try {
      await api.createWarehouse({
        name: form.name, wspCmName: form.wspCmName, district: form.district, state: form.state,
        commodities: form.commodities.split(',').map(s => s.trim()).filter(Boolean),
        capacityMT: Number(form.capacityMT), chargesPerMTPerDay: Number(form.chargesPerMTPerDay || 0),
        insuranceValidTill: form.insuranceValidTill
      });
      setInfo('Warehouse added.');
      setForm({ name: '', wspCmName: '', district: '', state: '', commodities: '', capacityMT: '', chargesPerMTPerDay: '', insuranceValidTill: '' });
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Warehouse Management" subtitle="Every registered warehouse, its capacity and insurance status — plus onboarding for a new one." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      <Card>
        <div className="grid-2">
          <div className="field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="field"><label>WSP/CM name</label><input value={form.wspCmName} onChange={e => set('wspCmName', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>District</label><input value={form.district} onChange={e => set('district', e.target.value)} /></div>
          <div className="field"><label>State</label><input value={form.state} onChange={e => set('state', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Commodities (comma separated)</label><input value={form.commodities} onChange={e => set('commodities', e.target.value)} placeholder="Soybean, Wheat" /></div>
          <div className="field"><label>Capacity (MT)</label><input type="number" value={form.capacityMT} onChange={e => set('capacityMT', e.target.value)} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Charges ₹/MT/day</label><input type="number" value={form.chargesPerMTPerDay} onChange={e => set('chargesPerMTPerDay', e.target.value)} /></div>
          <div className="field"><label>Insurance valid till</label><input type="date" value={form.insuranceValidTill} onChange={e => set('insuranceValidTill', e.target.value)} /></div>
        </div>
        <button className="btn btn-wheat" onClick={submit}>Add warehouse</button>
      </Card>

      {!warehouses ? <LoadingSkeleton rows={3} /> : warehouses.length === 0 ? (
        <EmptyState title="No warehouses yet" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Location</th><th>Capacity</th><th>Available</th><th>Insurance</th><th>Status</th></tr></thead>
            <tbody>
              {warehouses.map(w => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.district}, {w.state}</td>
                  <td>{w.capacityMT} MT</td>
                  <td>{w.availableCapacityMT} MT</td>
                  <td>{w.insuranceValidTill}</td>
                  <td><StatusBadge status={w.agreementApproved ? 'APPROVED' : 'PENDING'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
