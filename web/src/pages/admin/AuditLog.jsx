import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminAuditLog() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auditLog(200).then(setRows).catch(err => { setError(err.message); setRows([]); });
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every recorded action across the platform, most recent first. Entries are append-only — nothing here can be edited or deleted." />
      {error && <div className="error-banner">{error}</div>}

      {!rows ? <LoadingSkeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState title="No audit entries yet" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.timestamp).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: '0.78rem' }}>{r.actor}</td>
                  <td>{r.action}</td>
                  <td style={{ fontSize: '0.78rem' }}>{r.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
