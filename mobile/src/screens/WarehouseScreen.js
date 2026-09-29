import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { api } from '../api/client.js';
import { Card, Row, Badge, PrimaryButton, OutlineButton, ErrorBanner, EmptyState } from '../components/Ledger.js';
import { colors, spacing, type } from '../theme.js';

export default function WarehouseScreen() {
  const [commodity, setCommodity] = useState('');
  const [district, setDistrict] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [qty, setQty] = useState({});
  const [error, setError] = useState('');

  async function search() {
    setError('');
    try { setWarehouses(await api.searchWarehouses(commodity, district)); }
    catch (err) { setError(err.message); }
  }
  async function loadBookings() {
    try { setBookings(await api.myBookings()); } catch { /* ignore */ }
  }
  useEffect(() => { search(); loadBookings(); }, []);

  async function book(id) {
    setError('');
    const estimatedQuantityMT = Number(qty[id] || 0);
    if (!estimatedQuantityMT || !commodity) {
      setError('Enter a commodity above and an estimated quantity before booking.');
      return;
    }
    try {
      await api.bookWarehouse(id, { commodity, estimatedQuantityMT });
      await search(); await loadBookings();
    } catch (err) { setError(err.message); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Warehouse Booking</Text>
      <ErrorBanner message={error} />

      <Card>
        <Text style={type.label}>Commodity</Text>
        <TextInput style={styles.input} value={commodity} onChangeText={setCommodity} placeholder="Soybean" />
        <Text style={[type.label, { marginTop: spacing.sm }]}>District</Text>
        <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="Nashik" />
        <OutlineButton title="Search" onPress={search} />
      </Card>

      {warehouses.length === 0 ? <EmptyState text="No warehouses match — try clearing the filters." /> : warehouses.map(w => (
        <Card key={w.id}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{w.name}</Text>
            <Badge text={w.agreementApproved ? 'Approved' : 'Pending'} tone={w.agreementApproved ? 'green' : 'amber'} />
          </View>
          <Row label="WSP/CM" value={w.wspCmName} />
          <Row label="Location" value={`${w.district}, ${w.state}`} />
          <Row label="Available capacity" value={`${w.availableCapacityMT}/${w.capacityMT} MT`} />
          <Row label="Charges" value={`₹${w.chargesPerMTPerDay}/MT/day`} />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]} placeholder="Est. quantity (MT)" keyboardType="number-pad"
            value={qty[w.id] || ''} onChangeText={v => setQty(prev => ({ ...prev, [w.id]: v }))}
          />
          <PrimaryButton title="Book space" onPress={() => book(w.id)} />
        </Card>
      ))}

      <Text style={styles.sectionTitle}>My Bookings</Text>
      {bookings.length === 0 ? <EmptyState text="No bookings yet." /> : bookings.map(b => (
        <Card key={b.id}>
          <Row label={b.bookingRef} value={b.status} />
          <Row label={b.commodity} value={`${b.estimatedQuantityMT} MT`} />
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
  cardTitle: { fontWeight: '700', color: colors.ink, flexShrink: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm }
});
