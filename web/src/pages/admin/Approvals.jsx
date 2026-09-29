import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, StatusBadge, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminApprovals() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function load() {
    api.stockIntakes({ status: 'PENDING_MAKER_CHECKER' }).then(setRows).catch(err => { setError(err.message); setRows([]); });
  }
  useEffect(() => { load(); }, []);

  async function approve(intakeId) {
    setError(''); setInfo('');
    try {
      await api.approveStockIntake(intakeId);
      setInfo('Intake approved — it is now eligible for WR issuance.');
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Stock intake exceptions (reject % over threshold, or zero net weight) awaiting maker-checker sign-off, platform-wide." />
      {error && <div className="error-banner">{error}</div>}
      {info && <div className="success-banner">{info}</div>}

      {!rows ? <LoadingSkeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState title="No exceptions pending" description="Flagged stock intakes across every warehouse will appear here for sign-off." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Net (kg)</th><th>Reject %</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(i => (
                <tr key={i.id}>
                  <td>{i.intakeRef}</td><td>{i.netWeightKg}</td><td>{i.totalRejectPct}%</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td><button className="btn btn-wheat btn-sm" onClick={() => approve(i.id)}>Approve</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
