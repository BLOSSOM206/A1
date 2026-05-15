import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthAccount } from '../../services/authStore';
import { AppTheme, useTheme } from '../../theme';

type SignupScreenProps = {
  onSignup: (account: Omit<AuthAccount, 'createdAt'>) => Promise<AuthAccount>;
  onSignupSuccess: () => void;
  onGoToLogin: () => void;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSignup, onSignupSuccess, onGoToLogin }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter your full name, email, and password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirm password must match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSignup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      onSignupSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      Alert.alert('Signup failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.kicker}>A1 Clean</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your local account, then continue to profile setup.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={theme.colors.textSubtle} accessibilityLabel="Full name" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={theme.colors.textSubtle} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Email" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={theme.colors.textSubtle} secureTextEntry accessibilityLabel="Password" />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={theme.colors.textSubtle} secureTextEntry accessibilityLabel="Confirm password" />

          <Pressable style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]} onPress={handleSignup} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="Create account">
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Creating...' : 'Create Account'}</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]} onPress={onGoToLogin} accessibilityRole="button" accessibilityLabel="Back to login">
            <Text style={styles.secondaryButtonText}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  kicker: { color: theme.colors.primary, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { marginTop: 8, fontSize: 32, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: theme.colors.textMuted },
  card: { marginTop: 24, backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  label: { marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  input: { minHeight: 54, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 14, color: theme.colors.text, fontSize: 16, backgroundColor: theme.colors.inputBackground },
  primaryButton: { marginTop: 18, minHeight: 54, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: theme.colors.primaryText, fontSize: 16, fontWeight: '800' },
  secondaryButton: { marginTop: 12, minHeight: 54, borderRadius: 16, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border },
  secondaryButtonText: { color: theme.colors.secondaryText, fontSize: 15, fontWeight: '700' },
  buttonPressed: { opacity: 0.92 },
});
