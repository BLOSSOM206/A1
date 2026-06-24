/**
 * SOS Screen
 * Main screen with large SOS button and emergency sequence UI
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SOSButton } from '../../components/sos/SOSButton';
import { CountdownDisplay } from '../../components/sos/CountdownDisplay';
import { SOSStatus } from '../../components/sos/SOSStatus';
import { useSOS } from '../../hooks/emergency/useSOS';
import { useEmergencyProfile } from '../../context/EmergencyProfileContext';
import { SOS_CONFIG } from '../../constants/sosConfig';
import { AppTheme, useTheme } from '../../theme';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useScreenNarration } from '../../hooks/useScreenNarration';

type SOSScreenProps = {
  onBack?: () => void;
};

export const SOSScreen: React.FC<SOSScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { speak } = useAccessibility();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { profile, isLoading, contacts } = useEmergencyProfile();
  const sos = useSOS({ profile });
  const allergies = profile?.medicalInfo?.allergies || profile?.allergies || [];
  const conditions = profile?.medicalInfo?.conditions || profile?.medicalConditions || [];
  const lastCountdownAnnouncementRef = useRef<number | null>(null);
  const lastStatusRef = useRef('idle');

  // Check if profile is complete
  useEffect(() => {
    if (!sos.isProfileValid && !isLoading) {
      Alert.alert(
        'Emergency Profile Required',
        sos.profileValidationError ||
          'Please complete your emergency profile first.',
        [{ text: 'OK' }],
      );
    }
  }, [sos.isProfileValid, sos.profileValidationError, isLoading]);

  const sosCountdownTotalSeconds = Math.ceil(SOS_CONFIG.COUNTDOWN_DURATION_MS / 1000);
  const sosStatus = sos.error ? 'error' : sos.isCalling ? 'calling' : sos.isCountingDown ? 'counting' : 'idle';

  useScreenNarration({
    title: 'Emergency SOS',
    description: [
      sos.isProfileValid
        ? 'Emergency profile is ready.'
        : `Profile incomplete. ${sos.profileValidationError || 'Complete your emergency profile to enable SOS.'}`,
      'Tap the SOS button to start a countdown. Tap again to cancel if needed.',
      `The countdown is ${sosCountdownTotalSeconds} seconds.`,
      profile ? `${contacts.length} emergency contact${contacts.length === 1 ? '' : 's'} configured.` : '',
    ],
    enabled: !isLoading,
  });

  useEffect(() => {
    if (sosStatus === lastStatusRef.current) {
      return;
    }

    lastStatusRef.current = sosStatus;

    if (sosStatus === 'calling') {
      speak('Emergency call is being prepared.', { force: true, key: 'sos-calling', minRepeatMs: 15000 }).catch(() => undefined);
    } else if (sosStatus === 'error') {
      speak(`SOS error. ${sos.error}`, { force: true, key: 'sos-error', minRepeatMs: 15000 }).catch(() => undefined);
    } else if (sosStatus === 'idle') {
      lastCountdownAnnouncementRef.current = null;
    }
  }, [sos.error, sosStatus, speak]);

  useEffect(() => {
    if (!sos.isCountingDown) {
      lastCountdownAnnouncementRef.current = null;
      return;
    }

    const shouldAnnounce =
      sos.remainingSeconds === sosCountdownTotalSeconds ||
      sos.remainingSeconds === 3 ||
      sos.remainingSeconds === 1;

    if (!shouldAnnounce || lastCountdownAnnouncementRef.current === sos.remainingSeconds) {
      return;
    }

    lastCountdownAnnouncementRef.current = sos.remainingSeconds;
    speak(`${sos.remainingSeconds} second${sos.remainingSeconds === 1 ? '' : 's'} remaining.`, {
      force: true,
      key: `sos-countdown-${sos.remainingSeconds}`,
      minRepeatMs: 10000,
    }).catch(() => undefined);
  }, [sos.isCountingDown, sos.remainingSeconds, sosCountdownTotalSeconds, speak]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading emergency profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            accessibilityHint="Leave the emergency SOS screen"
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.subtitle}>
            Tap SOS to start a countdown, then tap again to cancel if needed.
          </Text>
        </View>

        {/* Profile Validation Warning */}
        {!sos.isProfileValid && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>Profile incomplete</Text>
            <Text style={styles.warningText}>
              {sos.profileValidationError}
            </Text>
            <Text style={styles.warningHint}>
              Complete your emergency profile to enable SOS functionality.
            </Text>
          </View>
        )}

        {/* Status Display */}
        {(sos.isCountingDown || sos.isCalling || sos.error) && (
          <SOSStatus
            isActive={sos.isCountingDown || sos.isCalling}
            status={
              sos.error
                ? 'error'
                : sos.isCalling
                ? 'calling'
                : sos.isCountingDown
                ? 'counting'
                : 'idle'
            }
            profile={profile}
            location={sos.lastEvent?.location || null}
            error={sos.error}
            onCancel={sos.cancelSOS}
            containerStyle={styles.statusDisplay}
          />
        )}

        {/* Countdown Display */}
        {sos.isCountingDown && (
          <View style={styles.countdownSection}>
            <CountdownDisplay
              remainingSeconds={sos.remainingSeconds}
              totalSeconds={sosCountdownTotalSeconds}
              variant="detailed"
              containerStyle={styles.countdown}
            />
          </View>
        )}

        {/* Main SOS Button */}
        <View style={styles.buttonContainer}>
          <SOSButton
            onPress={sos.startSOS}
            disabled={!sos.isProfileValid || sos.isCalling}
            isCountingDown={sos.isCountingDown}
            remainingSeconds={sos.remainingSeconds}
            size="large"
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How SOS Works</Text>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tap SOS Button</Text>
              <Text style={styles.stepDescription}>
                One tap starts a 5-second countdown
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Confirm or Cancel</Text>
              <Text style={styles.stepDescription}>
                Tap again to cancel, or wait for completion
              </Text>
            </View>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Emergency Alert Sent</Text>
              <Text style={styles.stepDescription}>
                Dialer opens with 112, location is included when available, and SMS opens for contacts.
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Status */}
        {profile && (
          <View style={styles.profileSummary}>
            <Text style={styles.profileTitle}>Your Emergency Profile</Text>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Name:</Text>
              <Text style={styles.profileValue}>{profile.fullName}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Can Communicate:</Text>
              <Text style={styles.profileValue}>
                {profile.canSpeak ? 'Able to speak' : 'Unable to speak'}
              </Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Emergency Contacts:</Text>
              <Text style={styles.profileValue}>{contacts.length} configured</Text>
            </View>

            {allergies.length > 0 && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Allergies:</Text>
                <Text style={styles.profileValue}>
                  {allergies.join(', ')}
                </Text>
              </View>
            )}

            {conditions.length > 0 && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Conditions:</Text>
                <Text style={styles.profileValue}>
                  {conditions.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Last Event Info */}
        {sos.lastEvent && (
          <View style={styles.lastEventContainer}>
            <Text style={styles.lastEventTitle}>Last Emergency Event</Text>
            <View
              style={[
                styles.lastEventStatus,
                {
                  borderLeftColor:
                    sos.lastEvent.status === 'completed' ? theme.colors.success : theme.colors.danger,
                },
              ]}
            >
              <Text style={styles.lastEventStatusText}>
                Status: {sos.lastEvent.status.toUpperCase()}
              </Text>
              <Text style={styles.lastEventTime}>
                {new Date(sos.lastEvent.timestamp).toLocaleString()}
              </Text>
              {sos.lastEvent.errors.length > 0 && (
                <Text style={styles.lastEventErrors}>
                  Errors: {sos.lastEvent.errors.length}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (_theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 104,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F44336',
    letterSpacing: 1,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 19,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 12,
  },
  backButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
  },

  warningBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F00',
    padding: 12,
    borderRadius: 6,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    marginTop: 4,
    lineHeight: 19,
  },
  warningHint: {
    fontSize: 12,
    color: '#FF6F00',
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 18,
  },

  statusDisplay: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  countdownSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  countdown: {
    width: '100%',
  },

  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },

  instructionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
  },

  profileSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileLabel: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 13,
    color: '#0D47A1',
    fontWeight: '700',
  },

  lastEventContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  lastEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  lastEventStatus: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  lastEventStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lastEventTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lastEventErrors: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
    marginTop: 4,
  },
});
