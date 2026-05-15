import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme, useTheme } from '../../theme';

export const AccessibilitySettings: React.FC = () => {
  const { theme, mode, isHighContrast, toggleDarkMode, toggleHighContrast } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Accessibility Settings
      </Text>
      <Text style={styles.helperText}>
        Adjust the display for better readability. Your choices are saved on this device.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
        onPress={() => {
          toggleDarkMode().catch(() => undefined);
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: mode === 'dark' }}
        accessibilityLabel="Dark mode"
      >
        <View style={styles.settingTextBlock}>
          <Text style={styles.settingTitle}>Dark Mode</Text>
          <Text style={styles.settingDescription}>Use a darker app background and surfaces.</Text>
        </View>
        <View style={[styles.switchTrack, mode === 'dark' ? styles.switchTrackOn : null]}>
          <View style={[styles.switchThumb, mode === 'dark' ? styles.switchThumbOn : null]} />
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
        onPress={() => {
          toggleHighContrast().catch(() => undefined);
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: isHighContrast }}
        accessibilityLabel="High contrast mode"
      >
        <View style={styles.settingTextBlock}>
          <Text style={styles.settingTitle}>High Contrast Mode</Text>
          <Text style={styles.settingDescription}>Increase border clarity, button visibility, and text contrast.</Text>
        </View>
        <View style={[styles.switchTrack, isHighContrast ? styles.switchTrackOn : null]}>
          <View style={[styles.switchThumb, isHighContrast ? styles.switchThumbOn : null]} />
        </View>
      </Pressable>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  helperText: {
    marginTop: 6,
    marginBottom: 12,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  settingRow: {
    minHeight: 70,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
  },
  settingTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  settingDescription: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  switchTrack: {
    width: 54,
    height: 32,
    borderRadius: 999,
    padding: 3,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primaryText,
  },
  pressed: {
    opacity: 0.92,
  },
});
