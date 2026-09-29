import React, { useEffect, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../AuthContext.js';
import { api } from '../api/client.js';
import { Card, Row, ErrorBanner, EmptyState } from '../components/Ledger.js';
import { colors, spacing } from '../theme.js';

export default function SettlementsScreen() {
  const { farmer } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.settlementsForFarmer(farmer.farmerId).then(setSettlements).catch(err => setError(err.message));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settlement History</Text>
      <ErrorBanner message={error} />

      {settlements.length === 0 ? <EmptyState text="No settlements yet." /> : settlements.map(s => (
        <Card key={s.id}>
          <Row label={s.settlementRef} value={new Date(s.settledAt).toLocaleDateString('en-IN')} />
          {s.steps.map((step, i) => (
            <Row key={i} label={step.step} value={`${step.amount >= 0 ? '+' : ''}₹${step.amount.toLocaleString('en-IN')}`} />
          ))}
          <Row label="Farmer payable" value={`₹${s.farmerPayable.toLocaleString('en-IN')}`} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: spacing.md }
});
