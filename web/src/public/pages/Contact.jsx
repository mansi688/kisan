import React, { useState } from 'react';
import { api } from '../../api.js';
import { MailIcon, PhoneIcon, MapPinIcon } from '../../components/icons.jsx';
import Seo from '../../components/Seo.jsx';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending'); setError('');
    try {
      await api.submitContactMessage(form);
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  return (
    <section className="pub-section pub-section-narrow">
      <Seo title="Contact" description="Get in touch with KisanUnnatti — questions about onboarding, a specific loan or lot, or general support." />
      <p className="pub-eyebrow">Contact</p>
      <h1 className="pub-h1" style={{ maxWidth: '16ch' }}>Get in touch</h1>
      <p className="pub-lede">Questions about onboarding, a specific loan or lot, or anything else — send a message and it lands directly in the platform's inbox.</p>

      <div className="contact-grid">
        <div>
          <div className="contact-info-item">
            <MailIcon width={18} height={18} color="var(--wheat-dark)" />
            <div><div className="contact-info-label">Email</div><div className="contact-info-value">support@kisanunnatti.in</div></div>
          </div>
          <div className="contact-info-item">
            <PhoneIcon width={18} height={18} color="var(--wheat-dark)" />
            <div><div className="contact-info-label">Phone</div><div className="contact-info-value">+91 22 4000 0000</div></div>
          </div>
          <div className="contact-info-item">
            <MapPinIcon width={18} height={18} color="var(--wheat-dark)" />
            <div><div className="contact-info-label">Office</div><div className="contact-info-value">Nashik, Maharashtra, India</div></div>
          </div>
        </div>

        <div className="ledger-card">
          {status === 'sent' ? (
            <div className="success-banner" style={{ margin: 0 }}>Thanks — your message has been received. We'll get back to you shortly.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-banner">{error}</div>}
              <div className="field"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              <div className="field"><label>Subject</label><input value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
              <div className="field"><label>Message</label><textarea rows={5} value={form.message} onChange={e => set('message', e.target.value)} required /></div>
              <button className="btn btn-wheat" style={{ width: '100%' }} disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
