import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../api/client.js';
import { Card, Row, PrimaryButton, OutlineButton, ErrorBanner, EmptyState } from '../components/Ledger.js';
import { colors, spacing, type } from '../theme.js';

export default function AuctionScreen() {
  const [auctions, setAuctions] = useState([]);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function load() {
    try {
      const list = await api.auctionsOpen();
      setAuctions(list);
      if (list.length) setSelected(list[0].id);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) { setView(null); return; }
    api.auctionFarmerView(selected).then(setView).catch(err => setError(err.message));
  }, [selected]);

  async function decide(decision) {
    setError(''); setInfo('');
    try {
      await api.submitDecision(selected, decision);
      setInfo(`Decision recorded: ${decision.replace('_', ' ')}.`);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Auction &amp; Price Discovery</Text>
      <ErrorBanner message={error} />
      {info ? <View style={styles.infoBanner}><Text style={{ color: colors.field, fontSize: 13 }}>{info}</Text></View> : null}

      {auctions.length === 0 ? <EmptyState text="No open auction lots right now." /> : (
        <Card>
          <Text style={type.label}>Auction lots</Text>
          {auctions.map(a => (
            <Text
              key={a.id} onPress={() => setSelected(a.id)}
              style={[styles.lotText, selected === a.id && styles.lotActive]}
            >
              {a.auctionId} — {a.commodity}, {a.quantityMT} MT
            </Text>
          ))}
        </Card>
      )}

      {view && (
        <Card>
          <Row label="Commodity / Quantity" value={`${view.auction.commodity} — ${view.auction.quantityMT} MT`} />
          <Row label="H1 bid" value={view.h1 ? `₹${view.h1.pricePerMT.toLocaleString('en-IN')}/MT = ₹${view.h1.totalValue.toLocaleString('en-IN')}` : 'No bids yet'} />
          {view.breakdown && (
            <>
              <Row label="Outstanding principal" value={`₹${view.breakdown.principal.toLocaleString('en-IN')}`} />
              <Row label="Accrued interest" value={`₹${view.breakdown.accruedInterest.toLocaleString('en-IN')}`} />
              <Row label="Storage charges" value={`₹${view.breakdown.storageCharges.toLocaleString('en-IN')}`} />
            </>
          )}
          <Row label="Estimated net proceeds" value={view.estimatedNetProceeds != null ? `₹${view.estimatedNetProceeds.toLocaleString('en-IN')}` : '—'} />

          {view.auction.status === 'OPEN' && (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <PrimaryButton title="Accept H1" onPress={() => decide('ACCEPT_H1')} />
              <OutlineButton title="Negotiate" onPress={() => decide('NEGOTIATE')} />
              <OutlineButton title="Wait & Watch" onPress={() => decide('WAIT_AND_WATCH')} />
            </View>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  infoBanner: { backgroundColor: 'rgba(47,111,79,0.1)', borderWidth: 1, borderColor: 'rgba(47,111,79,0.35)', padding: spacing.md, borderRadius: 5, marginBottom: spacing.md },
  lotText: { fontSize: 13, color: colors.inkSoft, paddingVertical: spacing.xs },
  lotActive: { color: colors.wheatDark, fontWeight: '700' }
});
