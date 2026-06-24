import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AccessibilityNeed,
  AccessibilityPreferences,
  defaultPreferences,
  useAccessibility,
} from '../../context/AccessibilityContext';
import { AppTheme, useTheme } from '../../theme';

type OnboardingScreenProps = {
  navigation: any;
};

type NeedCard = {
  id: AccessibilityNeed;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
};

const needCards: NeedCard[] = [
  { id: 'blindLowVision', icon: 'eye-off-outline', title: 'Blind / Low Vision', subtitle: 'Voice guidance, contrast, large text, and screen reader support.' },
  { id: 'hearingImpairment', icon: 'ear-hearing-off', title: 'Hearing Impairment', subtitle: 'Visual alerts, captions, and vibration confirmations.' },
  { id: 'mobilityImpairment', icon: 'wheelchair-accessibility', title: 'Mobility Impairment', subtitle: 'Bigger touch targets, reachable actions, and fewer swipes.' },
  { id: 'cognitiveDifferences', icon: 'head-cog-outline', title: 'Cognitive Differences', subtitle: 'Simpler screens, calm pacing, and step-by-step guidance.' },
  { id: 'speechDisability', icon: 'message-text-outline', title: 'Speech Disability', subtitle: 'Quick phrases, typed communication, and spoken message buttons.' },
  { id: 'elderlyAssistance', icon: 'account-heart-outline', title: 'Elderly Assistance', subtitle: 'Huge text, high contrast, extra spacing, and simpler navigation.' },
  { id: 'neurodivergentSupport', icon: 'brain', title: 'Neurodivergent Support', subtitle: 'Reduced motion, calm colors, and less clutter.' },
];

const preferenceRows: Array<{
  key: keyof AccessibilityPreferences;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { key: 'darkMode', title: 'Dark mode', subtitle: 'Use a darker app background.', icon: 'theme-light-dark' },
  { key: 'highContrast', title: 'High contrast mode', subtitle: 'Sharpen borders, text, and buttons.', icon: 'contrast-circle' },
  { key: 'largeText', title: 'Large text mode', subtitle: 'Increase text size across key screens.', icon: 'format-size' },
  { key: 'reducedMotion', title: 'Reduced motion', subtitle: 'Use calmer transitions and feedback.', icon: 'motion-pause-outline' },
  { key: 'voiceGuidance', title: 'Voice guidance', subtitle: 'Read important guidance aloud.', icon: 'volume-high' },
  { key: 'vibrationFeedback', title: 'Vibration feedback', subtitle: 'Confirm important actions by vibration.', icon: 'vibrate' },
  { key: 'simplifiedUi', title: 'Simplified UI mode', subtitle: 'Reduce clutter and show clearer steps.', icon: 'view-dashboard-outline' },
  { key: 'autoReadScreens', title: 'Auto-read screens aloud', subtitle: 'Speak important screens when opened.', icon: 'book-open-variant' },
  { key: 'biggerButtons', title: 'Bigger buttons', subtitle: 'Increase touch target size.', icon: 'gesture-tap-button' },
  { key: 'oneHandedNavigation', title: 'One-handed navigation', subtitle: 'Keep actions closer to the bottom.', icon: 'gesture-tap-hold' },
];

const ProgressDots = ({ step }: { step: number }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, 1, 48), [theme]);

  return (
    <View style={styles.dots} accessibilityRole="progressbar" accessibilityLabel={`Onboarding step ${step} of 3`}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={[styles.dot, item <= step ? styles.dotActive : null]} />
      ))}
    </View>
  );
};

const VoiceControls = () => {
  const { isMuted, toggleMute, speak } = useAccessibility();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, 1, 48), [theme]);

  return (
    <View style={styles.voiceControls}>
      <Pressable
        onPress={() => speak('Welcome to A1 Clean. Please select your accessibility needs.', { force: true })}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel="Replay voice guidance"
      >
        <MaterialCommunityIcons name="replay" size={22} color={theme.colors.primary} />
      </Pressable>
      <Pressable
        onPress={() => toggleMute().catch(() => undefined)}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        accessibilityRole="switch"
        accessibilityState={{ checked: !isMuted }}
        accessibilityLabel={isMuted ? 'Unmute accessibility voice' : 'Mute accessibility voice'}
      >
        <MaterialCommunityIcons name={isMuted ? 'volume-off' : 'volume-high'} size={22} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
};

export const AccessibilityWelcomeScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { speak, stopSpeaking, preferences } = useAccessibility();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, 1, 48), [theme]);

  useEffect(() => {
    if (preferences.autoReadScreens) {
      speak('Welcome to A1 Clean. Please select your accessibility needs. This helps us personalize the app experience for you.').catch(() => undefined);
    }
    return stopSpeaking;
  }, [preferences.autoReadScreens, speak, stopSpeaking]);

  return (
    <SafeAreaView style={styles.screen}>
      <ProgressDots step={1} />
      <VoiceControls />
      <View style={styles.centerContent}>
        <View style={styles.illustration} accessible accessibilityRole="image" accessibilityLabel="Accessibility support icon">
          <MaterialCommunityIcons name="human-greeting-variant" size={72} color={theme.colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">Tell us about your accessibility needs</Text>
        <Text style={styles.subtitle}>This helps us personalize the app experience for you.</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        onPress={() => navigation.navigate('Needs')}
        accessibilityRole="button"
        accessibilityLabel="Continue to accessibility needs"
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const SelectableNeedCard = ({ card, selected, onPress }: { card: NeedCard; selected: boolean; onPress: () => void }) => {
  const { theme } = useTheme();
  const { textScale, minTouchTarget } = useAccessibility();
  const styles = useMemo(() => createStyles(theme, textScale, minTouchTarget), [minTouchTarget, textScale, theme]);
  const scale = useMemo(() => new Animated.Value(selected ? 1 : 0), [selected]);

  useEffect(() => {
    if (!selected) {
      scale.setValue(0);
      return;
    }

    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
    }).start();
  }, [scale, selected]);

  const animatedStyle = {
    transform: [
      {
        scale: scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }),
      },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.needCard, selected ? styles.needCardSelected : null, pressed ? styles.pressed : null]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={card.title}
        accessibilityHint={card.subtitle}
      >
        <View style={[styles.needIcon, selected ? styles.needIconSelected : null]}>
          <MaterialCommunityIcons name={card.icon} size={28} color={selected ? theme.colors.primaryText : theme.colors.primary} />
        </View>
        <View style={styles.needText}>
          <Text style={styles.needTitle}>{card.title}</Text>
          <Text style={styles.needSubtitle}>{card.subtitle}</Text>
        </View>
        {selected ? <MaterialCommunityIcons name="check-circle" size={26} color={theme.colors.primary} /> : null}
      </Pressable>
    </Animated.View>
  );
};

export const AccessibilityNeedsScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { needs, toggleNeed, notify, preferences, speak, stopSpeaking } = useAccessibility();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, 1, 48), [theme]);

  useEffect(() => {
    if (preferences.autoReadScreens) {
      speak('Choose one or more accessibility needs. You can change these later in your profile.').catch(() => undefined);
    }
    return stopSpeaking;
  }, [preferences.autoReadScreens, speak, stopSpeaking]);

  return (
    <SafeAreaView style={styles.screen}>
      <ProgressDots step={2} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} accessibilityRole="header">What are your accessibility needs?</Text>
        <Text style={styles.subtitle}>Select all that apply. We will adapt the whole app around these choices.</Text>
        <View style={styles.needList}>
          {needCards.map((card) => (
            <SelectableNeedCard
              key={card.id}
              card={card}
              selected={needs.includes(card.id)}
              onPress={() => {
                toggleNeed(card.id).then(() => notify(`${card.title} ${needs.includes(card.id) ? 'removed' : 'selected'}`)).catch(() => undefined);
              }}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomActions}>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.primaryButton, styles.actionFlex, pressed ? styles.pressed : null]} onPress={() => navigation.navigate('Preferences')} accessibilityRole="button" accessibilityLabel="Continue to preferences">
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export const AccessibilityPreferencesScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { preferences, savePreferences, completeOnboarding, speak, stopSpeaking, textScale, minTouchTarget } = useAccessibility();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, textScale, minTouchTarget), [minTouchTarget, textScale, theme]);

  useEffect(() => {
    if (preferences.autoReadScreens) {
      speak('Review your accessibility preferences. These settings control the app display, sounds, motion, and communication tools.').catch(() => undefined);
    }
    return stopSpeaking;
  }, [preferences.autoReadScreens, speak, stopSpeaking]);

  const toggle = (key: keyof AccessibilityPreferences) => {
    savePreferences({ ...preferences, [key]: !preferences[key] }).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ProgressDots step={3} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} accessibilityRole="header">Fine tune your app experience</Text>
        <Text style={styles.subtitle}>We pre-selected helpful defaults. Adjust anything that does not feel right.</Text>

        {preferenceRows.map((row) => (
          <Pressable
            key={row.key}
            onPress={() => toggle(row.key)}
            style={({ pressed }) => [styles.preferenceRow, pressed ? styles.pressed : null]}
            accessibilityRole="switch"
            accessibilityState={{ checked: preferences[row.key] }}
            accessibilityLabel={row.title}
            accessibilityHint={row.subtitle}
          >
            <MaterialCommunityIcons name={row.icon} size={26} color={theme.colors.primary} />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>{row.title}</Text>
              <Text style={styles.preferenceSubtitle}>{row.subtitle}</Text>
            </View>
            <View style={[styles.switchTrack, preferences[row.key] ? styles.switchTrackOn : null]}>
              <View style={[styles.switchThumb, preferences[row.key] ? styles.switchThumbOn : null]} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bottomActions}>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, styles.actionFlex, pressed ? styles.pressed : null]}
          onPress={() => completeOnboarding()}
          accessibilityRole="button"
          accessibilityLabel="Finish accessibility onboarding"
        >
          <Text style={styles.primaryButtonText}>Finish</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export const getPreferenceRows = () => preferenceRows;
export const getDefaultOnboardingPreferences = () => defaultPreferences;

const createStyles = (theme: AppTheme, textScale: number, minTouchTarget: number) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 20, paddingBottom: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 8, paddingBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 10, backgroundColor: theme.colors.border },
  dotActive: { width: 24, backgroundColor: theme.colors.primary },
  voiceControls: { position: 'absolute', right: 20, top: 48, flexDirection: 'row', gap: 8, zIndex: 2 },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 28 },
  illustration: { width: 132, height: 132, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.chipBackground, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.chipBorder, marginBottom: 28 },
  title: { fontSize: 30 * textScale, lineHeight: 37 * textScale, fontWeight: '900', color: theme.colors.text, textAlign: 'center' },
  subtitle: { marginTop: 10, fontSize: 16 * textScale, lineHeight: 24 * textScale, color: theme.colors.textMuted, textAlign: 'center' },
  scrollContent: { paddingBottom: 18 },
  needList: { marginTop: 18, gap: 12 },
  needCard: { minHeight: Math.max(92, minTouchTarget), flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 16, backgroundColor: theme.colors.surface, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  needCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.chipBackground },
  needIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceMuted },
  needIconSelected: { backgroundColor: theme.colors.primary },
  needText: { flex: 1 },
  needTitle: { color: theme.colors.text, fontSize: 17 * textScale, fontWeight: '900' },
  needSubtitle: { marginTop: 4, color: theme.colors.textMuted, fontSize: 13 * textScale, lineHeight: 19 * textScale },
  bottomActions: { flexDirection: 'row', gap: 12, paddingTop: 10 },
  actionFlex: { flex: 1 },
  primaryButton: { minHeight: Math.max(58, minTouchTarget), borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 18 },
  primaryButtonText: { color: theme.colors.primaryText, fontSize: 17 * textScale, fontWeight: '900' },
  secondaryButton: { minHeight: Math.max(58, minTouchTarget), borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, paddingHorizontal: 22, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border },
  secondaryButtonText: { color: theme.colors.secondaryText, fontSize: 16 * textScale, fontWeight: '900' },
  preferenceRow: { minHeight: Math.max(76, minTouchTarget), flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, marginTop: 10, backgroundColor: theme.colors.surface, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  preferenceText: { flex: 1 },
  preferenceTitle: { color: theme.colors.text, fontSize: 16 * textScale, fontWeight: '900' },
  preferenceSubtitle: { marginTop: 3, color: theme.colors.textMuted, fontSize: 13 * textScale, lineHeight: 18 * textScale },
  switchTrack: { width: 54, height: 32, borderRadius: 999, padding: 3, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.secondary, justifyContent: 'center' },
  switchTrackOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong },
  switchThumbOn: { alignSelf: 'flex-end', backgroundColor: theme.colors.primaryText },
  pressed: { opacity: 0.9 },
});
