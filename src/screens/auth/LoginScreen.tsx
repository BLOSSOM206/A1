import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthAccount } from '../../services/authStore';
import { AppTheme, useTheme } from '../../theme';

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<AuthAccount>;
  onLoginSuccess: () => void;
  onGoToSignup: () => void;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onLoginSuccess, onGoToSignup }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onLogin(trimmedEmail, password);
      onLoginSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login failed', message);
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to the emergency app.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSubtle}
            secureTextEntry
            accessibilityLabel="Password"
          />

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
            onPress={handleLogin}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: isSubmitting }}
          >
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
            onPress={onGoToSignup}
            accessibilityRole="button"
            accessibilityLabel="Go to sign up"
          >
            <Text style={styles.secondaryButtonText}>Create a new account</Text>
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
