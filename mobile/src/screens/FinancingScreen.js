import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { api } from '../api/client.js';
import { Card, Row, Badge, PrimaryButton, ErrorBanner, EmptyState } from '../components/Ledger.js';
import { colors, spacing, type } from '../theme.js';

export default function FinancingScreen() {
  const [receipts, setReceipts] = useState([]);
  const [selectedWr, setSelectedWr] = useState('');
  const [offers, setOffers] = useState([]);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    api.farmerDashboard().then(d => {
      const free = d.warehouseReceipts.filter(w => w.status === 'ACTIVE');
      setReceipts(free);
      if (free.length) setSelectedWr(free[0].id);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedWr) return;
    api.offersForWr(selectedWr).then(setOffers).catch(err => setError(err.message));
  }, [selectedWr]);

  async function select(offerId) {
    setError(''); setInfo('');
    try {
      await api.selectOffer(offerId, otp);
      setInfo('Offer confirmed with digital consent. Your financer will now review and disburse.');
      setOffers(await api.offersForWr(selectedWr));
    } catch (err) { setError(err.message); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Financing Marketplace</Text>
      <ErrorBanner message={error} />
      {info ? <View style={styles.infoBanner}><Text style={{ color: colors.field, fontSize: 13 }}>{info}</Text></View> : null}

      {receipts.length === 0 ? (
        <EmptyState text="No unpledged WR available yet — issue a WR first via your WSP/CM." />
      ) : (
        <Card>
          <Text style={type.label}>Select WR</Text>
          {/* Simple selector list — avoids relying on the native Picker package being linked */}
          {receipts.map(w => (
            <View key={w.id} style={styles.wrOption}>
              <Text
                onPress={() => setSelectedWr(w.id)}
                style={[styles.wrOptionText, selectedWr === w.id && styles.wrOptionActive]}
              >
                {w.wrNumber} — {w.commodity}, ₹{w.valuation.wrValue.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {offers.length === 0 ? <EmptyState text="No offers submitted for this WR yet." /> : offers.map(o => (
        <Card key={o.id}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Offer</Text>
            <Badge text={o.status} />
          </View>
          <Row label="Amount" value={`₹${o.amount.toLocaleString('en-IN')}`} />
          <Row label="Interest rate" value={`${o.interestRatePct}% p.a.`} />
          <Row label="Processing fee" value={`₹${o.processingFee}`} />
          <Row label="Other charges" value={`₹${o.otherCharges}`} />
          <Row label="Tenure" value={`${o.tenureMonths} months`} />
          {o.status === 'SUBMITTED' && (
            <>
              <TextInput
                style={[styles.input, { marginTop: spacing.sm }]} placeholder="OTP (dev: 123456)"
                value={otp} onChangeText={setOtp} keyboardType="number-pad"
              />
              <PrimaryButton title="Confirm with OTP" onPress={() => select(o.id)} />
            </>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12, fontSize: 14, backgroundColor: colors.paperRaised, color: colors.ink },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontWeight: '700', color: colors.ink },
  infoBanner: { backgroundColor: 'rgba(47,111,79,0.1)', borderWidth: 1, borderColor: 'rgba(47,111,79,0.35)', padding: spacing.md, borderRadius: 5, marginBottom: spacing.md },
  wrOption: { paddingVertical: spacing.xs },
  wrOptionText: { fontSize: 13, color: colors.inkSoft },
  wrOptionActive: { color: colors.wheatDark, fontWeight: '700' }
});
