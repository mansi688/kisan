import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useParticipantAuth } from '../../participants/ParticipantAuthContext.jsx';
import { PageHeader, EmptyState, StatusBadge, LoadingSkeleton } from '../../components/ui.jsx';

function myWarehouses(all, participant) {
  const mine = all.filter(w => w.wspCmName === participant.orgName);
  return mine.length ? mine : all;
}

export default function WspApprovals() {
  const { participant } = useParticipantAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.warehousesAll().then(async all => {
      const mine = myWarehouses(all, participant);
      const lists = await Promise.all(mine.map(w => api.stockIntakes({ warehouseId: w.id, status: 'PENDING_MAKER_CHECKER' })));
      setRows(lists.flat());
    }).catch(err => { setError(err.message); setRows([]); });
  }, []);

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Stock intake exceptions (reject % over threshold, or zero net weight) held for maker-checker sign-off." />
      {error && <div className="error-banner">{error}</div>}

      {!rows ? <LoadingSkeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState title="No exceptions pending" description="Stock intakes with an unusually high reject percentage are held here until a manager or admin approves them." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Reference</th><th>Net (kg)</th><th>Reject %</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map(i => (
                  <tr key={i.id}><td>{i.intakeRef}</td><td>{i.netWeightKg}</td><td>{i.totalRejectPct}%</td><td><StatusBadge status={i.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.9rem' }}>
            Per the maker-checker rule, the operator who records an intake cannot also approve it — sign-off happens in the Admin portal.
          </p>
        </>
      )}
    </div>
  );
}
