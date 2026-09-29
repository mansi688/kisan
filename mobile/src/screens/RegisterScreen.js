import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch } from 'react-native';
import { useAuth } from '../AuthContext.js';
import { api } from '../api/client.js';
import { PrimaryButton, OutlineButton, ErrorBanner } from '../components/Ledger.js';
import { colors, spacing, type } from '../theme.js';

const STEPS = ['Mobile & OTP', 'KYC & Bank', 'Profile & Consent'];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  async function sendOtp() {
    setError('');
    try { await api.requestOtp(form.mobile); setOtpSent(true); }
    catch (err) { setError(err.message); }
  }

  async function verifyAndNext() {
    setError('');
    try { await api.verifyOtp(form.mobile, form.otp); setStep(1); }
    catch (err) { setError(err.message); }
  }

  async function submitRegistration() {
    setError('');
    setLoading(true);
    try {
      const { farmer, token } = await api.registerFarmer({
        ...form,
        preferredCommodities: form.preferredCommodities.split(',').map(s => s.trim()).filter(Boolean)
      });
      await login(farmer, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register your Farmer ID</Text>
        <Text style={styles.subtitle}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</Text>
        <ErrorBanner message={error} />

        {step === 0 && (
          <>
            <Field label="Mobile number" value={form.mobile} onChangeText={v => set('mobile', v)} keyboardType="phone-pad" />
            {!otpSent ? (
              <PrimaryButton title="Send OTP" onPress={sendOtp} />
            ) : (
              <>
                <Field label="Enter OTP (dev: 123456)" value={form.otp} onChangeText={v => set('otp', v)} keyboardType="number-pad" />
                <PrimaryButton title="Verify & continue" onPress={verifyAndNext} />
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Full name" value={form.name} onChangeText={v => set('name', v)} />
            <Field label="Date of birth (YYYY-MM-DD)" value={form.dob} onChangeText={v => set('dob', v)} />
            <Field label="Address" value={form.address} onChangeText={v => set('address', v)} />
            <Field label="Aadhaar — last 4 digits" value={form.aadhaarLast4} onChangeText={v => set('aadhaarLast4', v)} keyboardType="number-pad" maxLength={4} />
            <Field label="PAN" value={form.pan} onChangeText={v => set('pan', v.toUpperCase())} autoCapitalize="characters" />
            <Field label="Bank account number" value={form.bankAccountNumber} onChangeText={v => set('bankAccountNumber', v)} keyboardType="number-pad" />
            <Field label="IFSC" value={form.ifsc} onChangeText={v => set('ifsc', v.toUpperCase())} autoCapitalize="characters" />
            <Field label="Account holder name" value={form.accountHolderName} onChangeText={v => set('accountHolderName', v)} />
            <PrimaryButton title="Continue" onPress={() => setStep(2)} />
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Village" value={form.village} onChangeText={v => set('village', v)} />
            <Field label="Taluka" value={form.taluka} onChangeText={v => set('taluka', v)} />
            <Field label="District" value={form.district} onChangeText={v => set('district', v)} />
            <Field label="State" value={form.state} onChangeText={v => set('state', v)} />
            <Field label="Preferred commodities (comma separated)" value={form.preferredCommodities} onChangeText={v => set('preferredCommodities', v)} />
            <Field label="Set a password" value={form.password} onChangeText={v => set('password', v)} secureTextEntry />
            <View style={styles.consentRow}>
              <Switch value={form.consentAccepted} onValueChange={v => set('consentAccepted', v)} trackColor={{ true: colors.wheat }} />
              <Text style={styles.consentText}>I accept the terms, declarations and consent for KYC verification</Text>
            </View>
            <PrimaryButton title={loading ? 'Creating your Farmer ID…' : 'Complete registration'} onPress={submitRegistration} disabled={loading} />
          </>
        )}

        <OutlineButton title="Already registered? Sign in" onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </View>
  );
}

function Field(props) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={type.label}>{props.label}</Text>
      <TextInput style={styles.input} {...props} label={undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: spacing.lg, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkSoft, marginBottom: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12, fontSize: 14, backgroundColor: colors.paperRaised, color: colors.ink },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  consentText: { flex: 1, fontSize: 12, color: colors.inkSoft, marginLeft: spacing.sm }
});
