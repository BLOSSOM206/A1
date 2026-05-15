import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppTheme, useTheme } from '../theme';

type HomeScreenProps = {
  onOpenRestaurants: () => void;
  onOpenProfile: () => void;
  onOpenSOS: () => void;
  onOpenNotepad: () => void;
  onLogout: () => void;
  profileReady: boolean;
};

const actionCards = [
  {
    title: 'Browse Restaurants',
    subtitle: 'Accessible places and details',
  },
  {
    title: 'Emergency Profile',
    subtitle: 'Set up your personal details',
  },
  {
    title: 'Quick Notepad',
    subtitle: 'Preset phrases and typed messages',
  },
  {
    title: 'SOS',
    subtitle: 'Open the emergency flow quickly',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenRestaurants,
  onOpenProfile,
  onOpenSOS,
  onOpenNotepad,
  onLogout,
  profileReady,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>A1 Clean</Text>
        <Text style={styles.title}>Main Home</Text>
        <Text style={styles.subtitle}>
          Stable MVP flow for login, profile setup, restaurant browsing, and SOS.
        </Text>
      </View>

      {!profileReady ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Emergency profile is not complete yet.</Text>
          <Text style={styles.noticeText}>Set it up before relying on SOS in a real emergency.</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onOpenRestaurants} accessibilityRole="button" accessibilityLabel="Open restaurant listings">
          <Text style={styles.cardTitle}>{actionCards[0].title}</Text>
          <Text style={styles.cardText}>{actionCards[0].subtitle}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel="Open emergency profile setup">
          <Text style={styles.cardTitle}>{actionCards[1].title}</Text>
          <Text style={styles.cardText}>{actionCards[1].subtitle}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onOpenNotepad} accessibilityRole="button" accessibilityLabel="Open quick notepad">
          <Text style={styles.cardTitle}>{actionCards[2].title}</Text>
          <Text style={styles.cardText}>{actionCards[2].subtitle}</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.card, styles.emergencyCard, pressed ? styles.pressed : null]} onPress={onOpenSOS} accessibilityRole="button" accessibilityLabel="Open SOS screen">
          <Text style={[styles.cardTitle, styles.emergencyTitle]}>{actionCards[3].title}</Text>
          <Text style={[styles.cardText, styles.emergencyText]}>{actionCards[3].subtitle}</Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null]} onPress={onLogout} accessibilityRole="button" accessibilityLabel="Log out">
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: 20, paddingBottom: 32 },
  hero: { marginTop: 12, marginBottom: 20 },
  kicker: { color: theme.colors.primary, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { marginTop: 8, fontSize: 34, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: theme.colors.textMuted },
  notice: { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warningBorder, borderWidth: theme.isHighContrast ? 2 : 1, borderRadius: 20, padding: 16, marginBottom: 16 },
  noticeTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.warningText },
  noticeText: { marginTop: 4, color: theme.colors.warningText, lineHeight: 20 },
  grid: { gap: 12 },
  card: { borderRadius: 20, padding: 18, backgroundColor: theme.colors.surface, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  emergencyCard: { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.danger },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  cardText: { marginTop: 6, fontSize: 14, lineHeight: 20, color: theme.colors.textMuted },
  emergencyTitle: { color: theme.colors.dangerText },
  emergencyText: { color: theme.colors.dangerText },
  logoutButton: { marginTop: 20, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border },
  logoutText: { color: theme.colors.secondaryText, fontSize: 15, fontWeight: '800' },
});
