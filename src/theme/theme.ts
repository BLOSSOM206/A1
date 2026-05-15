export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  isHighContrast: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    accent: string;
    accentText: string;
    danger: string;
    dangerSurface: string;
    dangerText: string;
    warningSurface: string;
    warningBorder: string;
    warningText: string;
    success: string;
    border: string;
    borderStrong: string;
    inputBackground: string;
    chipBackground: string;
    chipBorder: string;
    chipText: string;
    shadow: string;
    overlay: string;
    disabled: string;
  };
};

type ThemePalette = AppTheme['colors'];

export const lightColors: ThemePalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#64748B',
  primary: '#0F766E',
  primaryText: '#FFFFFF',
  secondary: '#E2E8F0',
  secondaryText: '#0F172A',
  accent: '#2563EB',
  accentText: '#FFFFFF',
  danger: '#DC2626',
  dangerSurface: '#FFF1F2',
  dangerText: '#9F1239',
  warningSurface: '#FFF7ED',
  warningBorder: '#FB923C',
  warningText: '#9A3412',
  success: '#047857',
  border: '#CBD5E1',
  borderStrong: '#94A3B8',
  inputBackground: '#F8FAFC',
  chipBackground: '#EFF6FF',
  chipBorder: '#BFDBFE',
  chipText: '#1D4ED8',
  shadow: '#000000',
  overlay: 'rgba(15, 23, 42, 0.78)',
  disabled: '#94A3B8',
};

export const darkColors: ThemePalette = {
  background: '#0B1120',
  surface: '#111827',
  surfaceMuted: '#1F2937',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',
  primary: '#2DD4BF',
  primaryText: '#042F2E',
  secondary: '#334155',
  secondaryText: '#F8FAFC',
  accent: '#60A5FA',
  accentText: '#0B1120',
  danger: '#F87171',
  dangerSurface: '#3F121C',
  dangerText: '#FECDD3',
  warningSurface: '#3B2608',
  warningBorder: '#FDBA74',
  warningText: '#FED7AA',
  success: '#34D399',
  border: '#475569',
  borderStrong: '#94A3B8',
  inputBackground: '#0F172A',
  chipBackground: '#172554',
  chipBorder: '#3B82F6',
  chipText: '#BFDBFE',
  shadow: '#000000',
  overlay: 'rgba(2, 6, 23, 0.82)',
  disabled: '#64748B',
};

export const highContrastLightColors: ThemePalette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#000000',
  textMuted: '#111827',
  textSubtle: '#1F2937',
  primary: '#005A52',
  primaryText: '#FFFFFF',
  secondary: '#E5E7EB',
  secondaryText: '#000000',
  accent: '#003EA8',
  accentText: '#FFFFFF',
  danger: '#B00020',
  dangerSurface: '#FFF1F2',
  dangerText: '#7F0016',
  warningSurface: '#FFF4CC',
  warningBorder: '#92400E',
  warningText: '#4A2600',
  success: '#006B3C',
  border: '#111827',
  borderStrong: '#000000',
  inputBackground: '#FFFFFF',
  chipBackground: '#FFFFFF',
  chipBorder: '#003EA8',
  chipText: '#003EA8',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.86)',
  disabled: '#4B5563',
};

export const highContrastDarkColors: ThemePalette = {
  background: '#000000',
  surface: '#050505',
  surfaceMuted: '#111111',
  text: '#FFFFFF',
  textMuted: '#F3F4F6',
  textSubtle: '#E5E7EB',
  primary: '#7FFFEA',
  primaryText: '#000000',
  secondary: '#1F2937',
  secondaryText: '#FFFFFF',
  accent: '#93C5FD',
  accentText: '#000000',
  danger: '#FFB4C0',
  dangerSurface: '#250008',
  dangerText: '#FFDDE3',
  warningSurface: '#2B1B00',
  warningBorder: '#FFD166',
  warningText: '#FFE8A3',
  success: '#A7F3D0',
  border: '#FFFFFF',
  borderStrong: '#FFFFFF',
  inputBackground: '#000000',
  chipBackground: '#000000',
  chipBorder: '#93C5FD',
  chipText: '#DBEAFE',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.9)',
  disabled: '#9CA3AF',
};

export const createTheme = (mode: ThemeMode, isHighContrast: boolean): AppTheme => {
  if (isHighContrast && mode === 'dark') {
    return { mode, isHighContrast, colors: highContrastDarkColors };
  }

  if (isHighContrast) {
    return { mode, isHighContrast, colors: highContrastLightColors };
  }

  return { mode, isHighContrast, colors: mode === 'dark' ? darkColors : lightColors };
};
