import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccessibilityPreferences, useAccessibility } from '../../context/AccessibilityContext';
import { getPreferenceRows } from '../../screens/onboarding/AccessibilityOnboardingScreens';
import { describeVoice } from '../../services/accessibility/speechService';
import { AppTheme, useTheme } from '../../theme';

export const AccessibilitySettings: React.FC = () => {
  const { theme } = useTheme();
  const {
    minTouchTarget,
    needs,
    preferences,
    availableVoices,
    refreshVoices,
    restartOnboarding,
    savePreferences,
    saveVoiceSettings,
    speak,
    textScale,
    voiceSettings,
  } = useAccessibility();
  const styles = useMemo(() => createStyles(theme, textScale, minTouchTarget), [minTouchTarget, textScale, theme]);

  const toggle = (key: keyof AccessibilityPreferences) => {
    savePreferences({ ...preferences, [key]: !preferences[key] }).catch(() => undefined);
  };
  const selectedVoice = availableVoices.find((voice) => voice.identifier === voiceSettings.preferredVoiceId);
  const indianVoices = availableVoices.filter((voice) => {
    const text = `${voice.identifier} ${voice.name} ${voice.language}`.toLowerCase();
    return text.includes('en-in') || text.includes('hi-in') || text.includes('mr-in') || text.includes('india') || text.includes('indian');
  });
  const voiceChoices = (indianVoices.length > 0 ? indianVoices : availableVoices).slice(0, 12);

  const updateVoiceSetting = (changes: Partial<typeof voiceSettings>) => {
    saveVoiceSettings({ ...voiceSettings, ...changes }).catch(() => undefined);
  };

  const adjustVoiceNumber = (key: 'speechRate' | 'pitch' | 'volume', delta: number) => {
    updateVoiceSetting({ [key]: Number((voiceSettings[key] + delta).toFixed(2)) });
  };

  const testVoice = () => {
    speak('Please help me reach the entrance.', {
      force: true,
      language: 'en-IN',
      communication: true,
      key: 'voice-settings-test',
    }).catch(() => undefined);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Accessibility Settings
      </Text>
      <Text style={styles.helperText}>
        Edit how A1 Clean adapts display, voice guidance, feedback, and navigation.
      </Text>

      {needs.length > 0 ? (
        <Text style={styles.needSummary}>
          Active profile: {needs.map((need) => need.replace(/([A-Z])/g, ' $1')).join(', ')}
        </Text>
      ) : null}

      {getPreferenceRows().map((row) => (
        <Pressable
          key={row.key}
          style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
          onPress={() => toggle(row.key)}
          accessibilityRole="switch"
          accessibilityState={{ checked: preferences[row.key] }}
          accessibilityLabel={`${row.title}, ${preferences[row.key] ? 'on' : 'off'}`}
          accessibilityHint={row.subtitle}
        >
          <MaterialCommunityIcons name={row.icon} size={24} color={theme.colors.primary} />
          <View style={styles.settingTextBlock}>
            <Text style={styles.settingTitle}>{row.title}</Text>
            <Text style={styles.settingDescription}>{row.subtitle}</Text>
          </View>
          <View style={[styles.switchTrack, preferences[row.key] ? styles.switchTrackOn : null]}>
            <View style={[styles.switchThumb, preferences[row.key] ? styles.switchThumbOn : null]} />
          </View>
        </Pressable>
      ))}

      <View style={styles.voiceSection}>
        <Text style={styles.sectionSubtitle} accessibilityRole="header">
          Voice Settings
        </Text>
        <Text style={styles.helperText}>
          Preferred voice: {describeVoice(selectedVoice)}
        </Text>

        <View style={styles.voiceActions}>
          <Pressable
            style={({ pressed }) => [styles.smallButton, pressed ? styles.pressed : null]}
            onPress={() => refreshVoices().catch(() => undefined)}
            accessibilityRole="button"
            accessibilityLabel="Refresh available voices"
          >
            <Text style={styles.smallButtonText}>Refresh voices</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.smallButton, styles.testButton, pressed ? styles.pressed : null]}
            onPress={testVoice}
            accessibilityRole="button"
            accessibilityLabel="Test selected voice"
            accessibilityHint="Speaks a sample communication phrase"
          >
            <Text style={styles.testButtonText}>Test voice</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceList}>
          {voiceChoices.map((voice) => {
            const isSelected = voice.identifier === voiceSettings.preferredVoiceId;

            return (
              <Pressable
                key={voice.identifier}
                style={({ pressed }) => [styles.voiceChip, isSelected ? styles.voiceChipSelected : null, pressed ? styles.pressed : null]}
                onPress={() => updateVoiceSetting({ preferredVoiceId: voice.identifier })}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Select voice ${describeVoice(voice)}`}
              >
                <Text style={[styles.voiceChipTitle, isSelected ? styles.voiceChipTitleSelected : null]} numberOfLines={1}>
                  {voice.name || voice.identifier}
                </Text>
                <Text style={[styles.voiceChipMeta, isSelected ? styles.voiceChipMetaSelected : null]}>{voice.language}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {voiceChoices.length === 0 ? (
          <Text style={styles.voiceEmpty}>No device voices reported yet. Tap Refresh voices after Android TTS finishes loading.</Text>
        ) : null}

        <View style={styles.numberRows}>
          {[
            { key: 'speechRate' as const, label: 'Speech rate', step: 0.03 },
            { key: 'pitch' as const, label: 'Pitch', step: 0.02 },
            { key: 'volume' as const, label: 'Narration volume', step: 0.05 },
          ].map((item) => (
            <View key={item.key} style={styles.numberRow}>
              <View style={styles.numberLabelBlock}>
                <Text style={styles.settingTitle}>{item.label}</Text>
                <Text style={styles.settingDescription}>{voiceSettings[item.key].toFixed(2)}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.stepButton, pressed ? styles.pressed : null]}
                onPress={() => adjustVoiceNumber(item.key, -item.step)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${item.label}`}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.stepButton, pressed ? styles.pressed : null]}
                onPress={() => adjustVoiceNumber(item.key, item.step)}
                accessibilityRole="button"
                accessibilityLabel={`Increase ${item.label}`}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.revisitButton, pressed ? styles.pressed : null]}
        onPress={() => restartOnboarding().catch(() => undefined)}
        accessibilityRole="button"
        accessibilityLabel="Revisit accessibility onboarding"
        accessibilityHint="Choose accessibility needs and preferences again"
      >
        <Text style={styles.revisitText}>Revisit accessibility onboarding</Text>
      </Pressable>
    </View>
  );
};

const createStyles = (theme: AppTheme, textScale: number, minTouchTarget: number) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 17 * textScale,
    fontWeight: '800',
    color: theme.colors.text,
  },
  helperText: {
    marginTop: 6,
    marginBottom: 12,
    color: theme.colors.textMuted,
    fontSize: 14 * textScale,
    lineHeight: 20 * textScale,
  },
  needSummary: {
    marginBottom: 10,
    color: theme.colors.primary,
    fontSize: 13 * textScale,
    lineHeight: 18 * textScale,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sectionSubtitle: {
    color: theme.colors.text,
    fontSize: 16 * textScale,
    fontWeight: '900',
    marginTop: 18,
  },
  voiceSection: {
    marginTop: 8,
  },
  voiceActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  smallButton: {
    flex: 1,
    minHeight: Math.max(44, minTouchTarget),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.secondary,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
  },
  smallButtonText: {
    color: theme.colors.secondaryText,
    fontSize: 13 * textScale,
    fontWeight: '900',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  testButtonText: {
    color: theme.colors.accentText,
    fontSize: 13 * textScale,
    fontWeight: '900',
    textAlign: 'center',
  },
  voiceList: {
    paddingVertical: 4,
    gap: 8,
  },
  voiceChip: {
    width: 190,
    minHeight: 72,
    borderRadius: 14,
    padding: 12,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  voiceChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  voiceChipTitle: {
    color: theme.colors.text,
    fontSize: 13 * textScale,
    fontWeight: '900',
  },
  voiceChipTitleSelected: {
    color: theme.colors.primaryText,
  },
  voiceChipMeta: {
    color: theme.colors.textMuted,
    fontSize: 12 * textScale,
    fontWeight: '700',
    marginTop: 6,
  },
  voiceChipMetaSelected: {
    color: theme.colors.primaryText,
  },
  voiceEmpty: {
    color: theme.colors.textMuted,
    fontSize: 13 * textScale,
    lineHeight: 18 * textScale,
    marginTop: 8,
  },
  numberRows: {
    marginTop: 10,
    gap: 8,
  },
  numberRow: {
    minHeight: Math.max(58, minTouchTarget),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 10,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  numberLabelBlock: {
    flex: 1,
  },
  stepButton: {
    width: Math.max(44, minTouchTarget),
    height: Math.max(44, minTouchTarget),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.secondary,
  },
  stepButtonText: {
    color: theme.colors.secondaryText,
    fontSize: 20 * textScale,
    fontWeight: '900',
  },
  settingRow: {
    minHeight: Math.max(70, minTouchTarget),
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.inputBackground,
  },
  settingTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    color: theme.colors.text,
    fontSize: 15 * textScale,
    fontWeight: '800',
  },
  settingDescription: {
    color: theme.colors.textMuted,
    fontSize: 13 * textScale,
    lineHeight: 18 * textScale,
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
  revisitButton: {
    minHeight: Math.max(52, minTouchTarget),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginTop: 14,
    backgroundColor: theme.colors.secondary,
    borderWidth: theme.isHighContrast ? 2 : 0,
    borderColor: theme.colors.border,
  },
  revisitText: {
    color: theme.colors.secondaryText,
    fontSize: 14 * textScale,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
