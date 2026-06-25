// constants/colors.js
// Career Brain — design tokens
// Import from here instead of hardcoding colors anywhere in the app

const colors = {
  // ── Primary palette ──────────────────────────────
  navy: {
    950: '#060D18',
    900: '#0F1B2D',
    800: '#162236',
    700: '#1E3A52',
    600: '#254F72',
  },

  indigo: {
    600: '#4F46E5',
    500: '#6366F1',
    400: '#818CF8',
    100: '#E0E7FF',
    50:  '#EEF2FF',
  },

  // ── Semantic colors ───────────────────────────────
  emerald: {
    600: '#059669',
    500: '#10B981',
    100: '#D1FAE5',
    50:  '#ECFDF5',
  },

  amber: {
    600: '#D97706',
    500: '#F59E0B',
    100: '#FEF3C7',
    50:  '#FFFBEB',
  },

  red: {
    600: '#DC2626',
    500: '#EF4444',
    100: '#FEE2E2',
    50:  '#FEF2F2',
  },

  // ── Neutral palette ───────────────────────────────
  slate: {
    900: '#0F172A',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50:  '#F8FAFC',
  },

  white: '#FFFFFF',
  black: '#000000',
}

// ── Semantic aliases (use these in components) ────
export const theme = {
  // Backgrounds
  bg: {
    primary:   colors.navy[900],      // main dark bg (auth pages)
    secondary: colors.slate[50],      // light bg (dashboard, profile)
    card:      colors.white,          // card surfaces
    cardDark:  colors.navy[800],      // dark card surfaces
    hover:     colors.slate[100],     // hover states on light bg
    indigoSoft: colors.indigo[50],    // soft indigo tint
    emeraldSoft: colors.emerald[50],  // soft emerald tint
    amberSoft:  colors.amber[50],     // soft amber tint
    redSoft:    colors.red[50],       // soft red tint (errors)
  },

  // Text
  text: {
    primary:   colors.slate[900],     // main body text
    secondary: colors.slate[500],     // secondary/muted text
    tertiary:  colors.slate[400],     // placeholder text
    inverse:   colors.white,          // text on dark bg
    indigo:    colors.indigo[600],    // links, highlights
    emerald:   colors.emerald[600],   // success text
    amber:     colors.amber[600],     // warning text
    red:       colors.red[600],       // error text
  },

  // Borders
  border: {
    light:   colors.slate[200],       // default borders
    medium:  colors.slate[300],       // stronger borders
    indigo:  colors.indigo[100],      // indigo tinted borders
    focus:   colors.indigo[500],      // focus ring color
  },

  // Actions
  action: {
    primary:      colors.indigo[600], // primary button bg
    primaryHover: colors.indigo[500], // primary button hover
    primaryText:  colors.white,       // primary button text
  },

  // Score / readiness
  score: {
    high:   colors.emerald[500],      // 70–100%
    medium: colors.amber[500],        // 40–69%
    low:    colors.red[500],          // 0–39%
  },
}

export default colors