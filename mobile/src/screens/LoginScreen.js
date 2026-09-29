import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext.js';
import { api } from '../api/client.js';
import { PrimaryButton, ErrorBanner } from '../components/Ledger.js';
import { colors, spacing, type } from '../theme.js';

export default function LoginScreen({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const { farmer, token } = await api.loginFarmer(mobile, password);
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
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>KU</Text></View>
        <Text style={styles.title}>KisanUnnatti</Text>
        <Text style={styles.subtitle}>Commodity Finance &amp; Price Discovery</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <ErrorBanner message={error} />
          <Text style={type.label}>Mobile number</Text>
          <TextInput
            style={styles.input} value={mobile} onChangeText={setMobile}
            placeholder="98765 43210" keyboardType="phone-pad"
          />
          <Text style={[type.label, { marginTop: spacing.sm }]}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <PrimaryButton title={loading ? 'Signing in…' : 'Sign in'} onPress={handleLogin} disabled={loading} />
        </View>

        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          New to KisanUnnatti? Register your Farmer ID
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { padding: spacing.xl, paddingTop: 80, alignItems: 'center' },
  brandMark: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.wheat, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  brandMarkText: { color: colors.wheat, fontWeight: '700', fontSize: 18 },
  title: { color: colors.paper, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.panelTextSoft, fontSize: 12, marginBottom: spacing.xl },
  card: { backgroundColor: colors.paperRaised, borderRadius: 8, padding: spacing.lg, width: '100%' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 5, padding: 12, fontSize: 14, backgroundColor: colors.paperRaised, color: colors.ink },
  link: { color: colors.wheat, marginTop: spacing.xl, fontSize: 13 }
});
