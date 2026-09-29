import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, type } from '../theme.js';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function Badge({ text, tone = 'neutral' }) {
  const toneStyle = {
    green: { bg: 'rgba(47,111,79,0.12)', fg: colors.field },
    amber: { bg: 'rgba(184,121,31,0.14)', fg: colors.amber },
    red: { bg: 'rgba(162,59,46,0.13)', fg: colors.rust },
    neutral: { bg: 'rgba(28,37,48,0.08)', fg: colors.inkSoft }
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.badgeText, { color: toneStyle.fg }]}>{text}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, variant = 'wheat' }) {
  const bg = variant === 'wheat' ? colors.wheat : colors.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.outlineBtn}>
      <Text style={styles.outlineBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={{ color: colors.rust, fontSize: 13 }}>{message}</Text>
    </View>
  );
}

export function EmptyState({ text }) {
  return <Text style={styles.empty}>{text}</Text>;
}

/** A top-of-screen number with a colored icon accent — mirrors the web dashboard's metric cards. */
export function MetricCard({ label, value, icon, tone = 'wheat' }) {
  const toneBg = {
    wheat: colors.wheatSoft, field: 'rgba(85,112,58,0.12)', rust: 'rgba(162,59,46,0.12)', ink: 'rgba(28,36,18,0.08)'
  }[tone];
  const toneFg = { wheat: colors.wheatDark, field: colors.field, rust: colors.rust, ink: colors.ink }[tone];
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: toneBg }]}>
            {React.cloneElement(icon, { color: toneFg, size: 15 })}
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

/** A tappable shortcut used in a dashboard's "Quick actions" row. */
export function QuickAction({ label, icon, tone = 'wheat', onPress }) {
  const toneBg = {
    wheat: colors.wheatSoft, field: 'rgba(85,112,58,0.12)', rust: 'rgba(162,59,46,0.12)', ink: 'rgba(28,36,18,0.08)'
  }[tone];
  const toneFg = { wheat: colors.wheatDark, field: colors.field, rust: colors.rust, ink: colors.ink }[tone];
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.metricIcon, { backgroundColor: toneBg, marginRight: spacing.sm }]}>
        {React.cloneElement(icon, { color: toneFg, size: 15 })}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line
  },
  label: { ...type.body, color: colors.inkSoft, flexShrink: 1, paddingRight: spacing.sm },
  value: { ...type.value },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  btn: { paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginTop: spacing.sm },
  btnText: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  outlineBtn: { paddingVertical: 12, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginTop: spacing.sm },
  outlineBtnText: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  errorBanner: { backgroundColor: 'rgba(162,59,46,0.1)', borderWidth: 1, borderColor: 'rgba(162,59,46,0.35)', padding: spacing.md, borderRadius: 5, marginBottom: spacing.md },
  empty: { color: colors.inkSoft, fontStyle: 'italic', paddingVertical: spacing.lg },
  metricCard: {
    flex: 1, minWidth: '47%', backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.line,
    borderRadius: 8, padding: spacing.md
  },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  metricLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, flexShrink: 1, paddingRight: 4 },
  metricIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperRaised, borderWidth: 1,
    borderColor: colors.line, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginRight: spacing.sm, marginBottom: spacing.sm
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: colors.ink }
});
