import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const STEPS = ['Mobile & OTP', 'KYC & Bank', 'Profile & Consent'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login, farmer } = useAuth();
  const [arrivedSignedIn] = useState(!!farmer);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mobile: '', otp: '',
    name: '', dob: '', address: '',
    aadhaarLast4: '', pan: '',
    bankAccountNumber: '', ifsc: '', accountHolderName: '',
    village: '', taluka: '', district: '', state: '',
    preferredCommodities: '',
    password: '',
    consentAccepted: false
  });

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  if (arrivedSignedIn) return <Navigate to="/dashboard" replace />;

  async function sendOtp() {
    setError('');
    try {
      await api.requestOtp(form.mobile);
      setOtpSent(true);
    } catch (err) { setError(err.message); }
  }

  async function verifyAndNext() {
    setError('');
    try {
      await api.verifyOtp(form.mobile, form.otp);
      setStep(1);
    } catch (err) { setError(err.message); }
  }

  async function submitRegistration() {
    setError('');
    setLoading(true);
    try {
      const { farmer, token } = await api.registerFarmer({
        ...form,
        preferredCommodities: form.preferredCommodities.split(',').map(s => s.trim()).filter(Boolean)
      });
      login(farmer, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-wrap wide">
        <div className="auth-brand">
          <img className="brand-mark" src="/logo.webp" alt="KisanUnnatti" />
          <span className="brand-name">KisanUnnatti</span>
        </div>
        <div className="auth-card">
        <p className="stepper-label">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`stepper-item ${i < step ? 'done' : i === step ? 'active' : ''}`} />
          ))}
        </div>
        <h1 className="auth-title">Register your Farmer ID</h1>
        {error && <div className="error-banner">{error}</div>}

        {step === 0 && (
          <>
            <div className="field">
              <label>Mobile number</label>
              <input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="98765 43210" />
            </div>
            {!otpSent ? (
              <button className="btn btn-wheat" onClick={sendOtp}>Send OTP</button>
            ) : (
              <>
                <div className="field">
                  <label>Enter OTP (dev: 123456)</label>
                  <input value={form.otp} onChange={e => set('otp', e.target.value)} />
                </div>
                <button className="btn btn-wheat" onClick={verifyAndNext}>Verify & continue</button>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid-2">
              <div className="field"><label>Full name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="field"><label>Date of birth</label><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></div>
            </div>
            <div className="field"><label>Address</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="grid-2">
              <div className="field"><label>Aadhaar — last 4 digits</label><input maxLength={4} value={form.aadhaarLast4} onChange={e => set('aadhaarLast4', e.target.value)} /></div>
              <div className="field"><label>PAN</label><input value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Bank account number</label><input value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} /></div>
              <div className="field"><label>IFSC</label><input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} /></div>
            </div>
            <div className="field"><label>Account holder name</label><input value={form.accountHolderName} onChange={e => set('accountHolderName', e.target.value)} /></div>
            <button className="btn btn-wheat" onClick={() => setStep(2)}>Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid-2">
              <div className="field"><label>Village</label><input value={form.village} onChange={e => set('village', e.target.value)} /></div>
              <div className="field"><label>Taluka</label><input value={form.taluka} onChange={e => set('taluka', e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>District</label><input value={form.district} onChange={e => set('district', e.target.value)} /></div>
              <div className="field"><label>State</label><input value={form.state} onChange={e => set('state', e.target.value)} /></div>
            </div>
            <div className="field"><label>Preferred commodities (comma separated)</label><input value={form.preferredCommodities} onChange={e => set('preferredCommodities', e.target.value)} placeholder="Soybean, Wheat" /></div>
            <div className="field">
              <label htmlFor="reg-password">Set a password</label>
              <PasswordInput id="reg-password" value={form.password} onChange={e => set('password', e.target.value)} />
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.3rem' }}>
                At least 8 characters, with a mix of at least 3 of: uppercase, lowercase, numbers, symbols
              </p>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input type="checkbox" id="reg-consent" style={{ width: 'auto', marginTop: '0.2rem' }} checked={form.consentAccepted} onChange={e => set('consentAccepted', e.target.checked)} />
              <label htmlFor="reg-consent" style={{ margin: 0, fontWeight: 400 }}>
                I accept the <Link to="/terms">Terms &amp; Conditions</Link> and acknowledge the{' '}
                <Link to="/privacy">Privacy Policy</Link>, including consent for KYC verification
              </label>
            </div>
            <button className="btn btn-wheat" onClick={submitRegistration} disabled={loading || !form.consentAccepted}>
              {loading ? 'Creating your Farmer ID…' : 'Complete registration'}
            </button>
          </>
        )}

        <hr className="hairline" />
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
