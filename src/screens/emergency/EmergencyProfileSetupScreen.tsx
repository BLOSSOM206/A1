import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmergencyProfile } from '../../types/Emergency';
import { useEmergencyProfile } from '../../context/EmergencyProfileContext';
import { AccessibilitySettings } from '../../components/settings/AccessibilitySettings';
import { AppTheme, useTheme } from '../../theme';

type EmergencyProfileSetupScreenProps = {
  onDone?: () => void;
};

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const EmergencyProfileSetupScreen: React.FC<EmergencyProfileSetupScreenProps> = ({ onDone }) => {
  const { profile, setProfile, isLoading } = useEmergencyProfile();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [fullName, setFullName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFullName(profile.fullName || '');
    setEmergencyContactNumber(profile.emergencyContactNumber || '');
    setBloodGroup(profile.bloodGroup || profile.medicalInfo?.bloodType || '');
    setAllergies((profile.allergies || profile.medicalInfo?.allergies || []).join(', '));
    setMedicalConditions((profile.medicalConditions || profile.medicalInfo?.conditions || []).join(', '));
    setDisabilityType(profile.disabilityType || '');
    setAddress(profile.address || '');
    setNotes(profile.notes || profile.medicalInfo?.notes || '');
  }, [profile]);

  const existingProfileLabel = useMemo(
    () => (profile ? 'Update emergency profile' : 'Save emergency profile'),
    [profile],
  );

  const handleSave = async () => {
    const nextFullName = fullName.trim();
    const nextContact = emergencyContactNumber.trim();
    const nextAddress = address.trim();

    if (!nextFullName || !nextContact || !nextAddress) {
      Alert.alert('Missing fields', 'Full name, emergency contact number, and address are required.');
      return;
    }

    if (nextContact.length < 8) {
      Alert.alert('Invalid contact number', 'Enter a valid emergency contact number.');
      return;
    }

    try {
      setIsSaving(true);

      const nextProfile: EmergencyProfile = {
        userId: profile?.userId || `profile-${Date.now()}`,
        fullName: nextFullName,
        emergencyContactNumber: nextContact,
        bloodGroup: bloodGroup.trim() || undefined,
        allergies: splitList(allergies),
        medicalConditions: splitList(medicalConditions),
        disabilityType: disabilityType.trim() || undefined,
        address: nextAddress,
        notes: notes.trim() || undefined,
        medicalInfo: {
          allergies: splitList(allergies),
          conditions: splitList(medicalConditions),
          medications: [],
          bloodType: bloodGroup.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        emergencyContacts: [
          {
            id: 'primary-emergency-contact',
            name: 'Primary emergency contact',
            phone: nextContact,
            relationship: 'primary',
            priority: 1,
          },
        ],
        canSpeak: profile?.canSpeak ?? true,
        lastUpdated: Date.now(),
      };

      await setProfile(nextProfile);
      Alert.alert('Saved', 'Emergency profile saved locally.');
      onDone?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading emergency profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.kicker}>Emergency Profile</Text>
          <Text style={styles.title}>Profile setup</Text>
          <Text style={styles.subtitle}>
            Save the essentials locally so SOS can show the right information.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Full name" />

          <Text style={styles.label}>Emergency Contact Number *</Text>
          <TextInput style={styles.input} value={emergencyContactNumber} onChangeText={setEmergencyContactNumber} placeholder="112 or your trusted contact" placeholderTextColor={theme.colors.textSubtle} keyboardType="phone-pad" accessibilityLabel="Emergency contact number" />

          <Text style={styles.label}>Address *</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Home address or current address" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Address" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Details</Text>

          <Text style={styles.label}>Blood Group</Text>
          <TextInput style={styles.input} value={bloodGroup} onChangeText={setBloodGroup} placeholder="e.g. O+, A-" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Blood group" />

          <Text style={styles.label}>Allergies</Text>
          <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="Comma-separated allergies" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Allergies" />

          <Text style={styles.label}>Medical Conditions</Text>
          <TextInput style={styles.input} value={medicalConditions} onChangeText={setMedicalConditions} placeholder="Comma-separated conditions" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Medical conditions" />
        </View>

        <AccessibilitySettings />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Accessibility Notes</Text>

          <Text style={styles.label}>Disability Type</Text>
          <TextInput style={styles.input} value={disabilityType} onChangeText={setDisabilityType} placeholder="Optional" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Disability type" />

          <Text style={styles.label}>Optional Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything responders should know"
            placeholderTextColor={theme.colors.textSubtle}
            multiline
            accessibilityLabel="Optional notes"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed ? styles.pressed : null, isSaving ? styles.disabled : null]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={existingProfileLabel}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : existingProfileLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: 20, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.textMuted, fontSize: 16 },
  header: { marginTop: 12, marginBottom: 18 },
  kicker: { color: theme.colors.primary, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { marginTop: 8, fontSize: 32, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: theme.colors.textMuted },
  card: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
  label: { marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  input: { minHeight: 52, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, color: theme.colors.text, fontSize: 16, backgroundColor: theme.colors.inputBackground },
  notesInput: { minHeight: 92, textAlignVertical: 'top', paddingTop: 12 },
  saveButton: { minHeight: 56, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveButtonText: { color: theme.colors.primaryText, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.7 },
});
