import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext.js';
import { api } from '../api/client.js';
import { Card, Row, Badge, ErrorBanner, EmptyState, MetricCard, QuickAction } from '../components/Ledger.js';
import { colors, spacing } from '../theme.js';

function riskTone(status) {
  if (status === 'RED') return 'red';
  if (status === 'AMBER') return 'amber';
  return 'green';
}

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function DashboardScreen() {
  const { farmer } = useAuth();
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [exposures, setExposures] = useState({});
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.farmerDashboard();
      setData(d);
      const activeLoans = d.loans.filter(l => l.status === 'ACTIVE');
      const results = {};
      for (const loan of activeLoans) {
        try { results[loan.id] = await api.loanExposure(loan.id); } catch { /* ignore */ }
      }
      setExposures(results);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const activeLoans = data ? data.loans.filter(l => l.status === 'ACTIVE') : [];
  const totalWrValue = data ? data.warehouseReceipts.reduce((s, w) => s + (w.valuation?.wrValue || 0), 0) : 0;
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.principal, 0);

  return (
    <ScrollView
      style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Namaste, {farmer.name.split(' ')[0]}</Text>
      <Text style={styles.farmerId}>{farmer.farmerId}</Text>
      <ErrorBanner message={error} />

      {!data ? <EmptyState text="Loading your dashboard…" /> : (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Total WR Value" value={inr(totalWrValue)} tone="wheat" icon={<MaterialCommunityIcons name="receipt-text" />} />
            <MetricCard label="Outstanding Loan" value={inr(totalOutstanding)} tone="rust" icon={<MaterialCommunityIcons name="cash-multiple" />} />
            <MetricCard label="Active Loans" value={activeLoans.length} tone="field" icon={<MaterialCommunityIcons name="hand-coin" />} />
            <MetricCard label="Settled" value={data.settlements.length} tone="ink" icon={<MaterialCommunityIcons name="check-circle-outline" />} />
          </View>

          <View style={styles.quickRow}>
            <QuickAction label="Store" tone="wheat" icon={<MaterialCommunityIcons name="warehouse" />} onPress={() => navigation.navigate('Warehouse')} />
            <QuickAction label="Finance" tone="field" icon={<MaterialCommunityIcons name="cash-multiple" />} onPress={() => navigation.navigate('Financing')} />
            <QuickAction label="Sell" tone="rust" icon={<MaterialCommunityIcons name="gavel" />} onPress={() => navigation.navigate('Auction')} />
          </View>

          <Text style={styles.sectionTitle}>Warehouse Receipts</Text>
          {data.warehouseReceipts.length === 0 ? <EmptyState text="No WRs yet — book a warehouse to get started." /> : (
            <Card>
              {data.warehouseReceipts.map(wr => (
                <Row key={wr.id} label={`${wr.wrNumber} · ${wr.commodity} · ${wr.quantityMT} MT`} value={`₹${wr.valuation.wrValue.toLocaleString('en-IN')}`} />
              ))}
            </Card>
          )}

          <Text style={styles.sectionTitle}>Loan &amp; Risk Monitoring</Text>
          {activeLoans.length === 0 ? <EmptyState text="No active loans." /> : (
            activeLoans.map(loan => {
              const exp = exposures[loan.id];
              return (
                <Card key={loan.id}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{loan.loanRef}</Text>
                    {exp && <Badge text={exp.status} tone={riskTone(exp.status)} />}
                  </View>
                  <Row label="Principal" value={`₹${loan.principal.toLocaleString('en-IN')}`} />
                  {exp && (
                    <>
                      <Row label="Accrued interest" value={`₹${exp.accruedInterest.toLocaleString('en-IN')}`} />
                      <Row label="Storage charges" value={`₹${exp.storageCharges.toLocaleString('en-IN')}`} />
                      <Row label="Total exposure" value={`₹${exp.totalExposure.toLocaleString('en-IN')} (${exp.utilisationPct}%)`} />
                      <Row label="Maturity" value={`${exp.maturityDate} · ${exp.daysToMaturity}d left`} />
                    </>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.ink },
  farmerId: { fontSize: 12, color: colors.inkSoft, marginBottom: spacing.lg },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontWeight: '700', color: colors.ink }
});
