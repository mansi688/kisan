import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { PageHeader, EmptyState, StatusBadge, LoadingSkeleton } from '../../components/ui.jsx';

export default function AdminInbox() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.contactMessages().then(setMessages).catch(err => { setError(err.message); setMessages([]); });
  }, []);

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Messages submitted through the public website's Contact page." />
      {error && <div className="error-banner">{error}</div>}

      {!messages ? <LoadingSkeleton rows={3} /> : messages.length === 0 ? (
        <EmptyState title="No messages yet" description="Submissions from the public Contact page will appear here." />
      ) : messages.map(m => (
        <div className="ledger-card" key={m.id}>
          <div className="ledger-row">
            <span className="ledger-label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name} · {m.email}</span>
            <span className="ledger-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {new Date(m.createdAt).toLocaleDateString('en-IN')} <StatusBadge status={m.status} />
            </span>
          </div>
          {m.subject && <div className="ledger-row"><span className="ledger-label">Subject</span><span className="ledger-value">{m.subject}</span></div>}
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '0.6rem' }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}
