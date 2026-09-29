// Same ivory/forest/gold palette as the cinematic landing page and web app
// (see web/public/landing.html and web/src/styles.css) so the brand feels
// identical whether the farmer opens the app, the website, or the landing
// experience. Font is Manrope, matching the landing page's --font exactly.
export const colors = {
  ink: '#1C2412',
  inkSoft: '#4A5138',
  paper: '#F4EFE7',
  paperRaised: '#FBF9F3',
  wheat: '#BD8B42',
  wheatDark: '#8C6428',
  wheatSoft: '#F0E2C0',
  field: '#55703A',
  amber: '#B8791F',
  rust: '#A23B2E',
  line: '#DDD2B4',
  // Theme-invariant dark panel (bottom tab bar background, header) — the
  // landing page's own --forest-darker, matching web's --panel-bg.
  panelBg: '#10140A',
  panelText: '#F3EEE3',
  panelTextSoft: '#CFC6AC'
};

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold'
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  title: { fontSize: 22, fontFamily: fonts.bold, color: colors.ink },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkSoft },
  label: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.inkSoft, marginBottom: 4 },
  value: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.ink, fontVariant: ['tabular-nums'] },
  body: { fontSize: 14, fontFamily: fonts.regular, color: colors.ink }
};
