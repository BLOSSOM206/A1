/**
 * useSOS Hook
 * Main hook for SOS orchestration
 * Manages countdown, location, TTS, and emergency call/SMS
 */

import { useCallback, useRef, useState } from 'react';
import { SOSEvent, SOSSystemState, EmergencyProfile } from '../../types/Emergency';
import { SOSService } from '../../services/emergency/sosService';
import { useEmergencyCountdown } from './useEmergencyCountdown';
import { SOS_CONFIG, DEFAULT_EMERGENCY_NUMBER } from '../../constants/sosConfig';

export interface UseSOSParams {
  profile: EmergencyProfile | null;
  emergencyNumber?: string;
}

export const useSOS = ({ profile, emergencyNumber = DEFAULT_EMERGENCY_NUMBER }: UseSOSParams) => {
  const [systemState, setSystemState] = useState<SOSSystemState>({
    isCountingDown: false,
    remainingSeconds: 0,
    isCalling: false,
    lastEvent: null,
    error: null,
  });

  const lastEventRef = useRef<SOSEvent | null>(null);

  /**
   * Countdown hook - manage 5-second countdown
   */
  const countdown = useEmergencyCountdown({
    duration: SOS_CONFIG.COUNTDOWN_DURATION_MS,
    autoStart: false,
    onCountdownTick: (remaining) => {
      setSystemState((prev) => ({
        ...prev,
        remainingSeconds: remaining,
      }));
    },
    onCountdownComplete: () => {
      handleCountdownComplete();
    },
    onCountdownCancel: () => {
      handleCountdownCancel();
    },
  });

  /**
   * Validate profile before starting SOS
   */
  const validateProfile = useCallback((): { valid: boolean; error?: string } => {
    if (!profile) {
      return { valid: false, error: 'Emergency profile not configured' };
    }

    if (!profile.fullName?.trim()) {
      return { valid: false, error: 'Profile missing: Full name' };
    }

    if (!profile.emergencyContacts?.length) {
      return { valid: false, error: 'No emergency contacts configured' };
    }

    return { valid: true };
  }, [profile]);

  /**
   * Start SOS countdown (5 seconds before emergency call)
   */
  const startSOS = useCallback(() => {
    try {
      if (systemState.isCalling) {
        return;
      }

      if (systemState.isCountingDown) {
        countdown.cancel();
        handleCountdownCancel();
        return;
      }

      setSystemState((prev) => ({
        ...prev,
        error: null,
      }));

      const validation = validateProfile();
      if (!validation.valid) {
        setSystemState((prev) => ({
          ...prev,
          error: validation.error || 'Profile validation failed',
        }));
        return;
      }

      setSystemState((prev) => ({
        ...prev,
        isCountingDown: true,
      }));

      countdown.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start SOS';
      setSystemState((prev) => ({
        ...prev,
        error: message,
      }));
    }
  }, [countdown, systemState.isCalling, systemState.isCountingDown, validateProfile]);

  /**
   * Handle countdown completion - execute SOS sequence
   */
  const handleCountdownComplete = async () => {
    if (!profile) return;

    try {
      setSystemState((prev) => ({
        ...prev,
        isCountingDown: false,
        isCalling: true,
        error: null,
      }));

      // Execute full SOS sequence (call, TTS, SMS)
      const event = await SOSService.triggerSOS(profile, emergencyNumber);

      lastEventRef.current = event;

      setSystemState((prev) => ({
        ...prev,
        isCalling: false,
        lastEvent: event,
        error: event.errors.length > 0 ? event.errors[0] : null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SOS execution failed';
      setSystemState((prev) => ({
        ...prev,
        isCalling: false,
        error: message,
      }));
    }
  };

  /**
   * Cancel SOS before countdown completes
   */
  const handleCountdownCancel = () => {
    setSystemState((prev) => ({
      ...prev,
      isCountingDown: false,
      remainingSeconds: 0,
      error: null,
    }));
  };

  /**
   * Manual cancel SOS (user presses cancel button)
   */
  const cancelSOS = useCallback(() => {
    countdown.cancel();
    handleCountdownCancel();
  }, [countdown]);

  /**
   * Retry last SOS event
   */
  const retryLastSOS = useCallback(async () => {
    if (!lastEventRef.current || !profile) {
      setSystemState((prev) => ({
        ...prev,
        error: 'No previous SOS event to retry',
      }));
      return;
    }

    try {
      setSystemState((prev) => ({
        ...prev,
        isCalling: true,
        error: null,
      }));

      const event = await SOSService.triggerSOS(profile, emergencyNumber);
      lastEventRef.current = event;

      setSystemState((prev) => ({
        ...prev,
        isCalling: false,
        lastEvent: event,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Retry failed';
      setSystemState((prev) => ({
        ...prev,
        isCalling: false,
        error: message,
      }));
    }
  }, [profile, emergencyNumber]);

  /**
   * Get SOS event history
   */
  const getSOSHistory = useCallback(async (limit: number = 20) => {
    try {
      return await SOSService.getSOSHistory(limit);
    } catch (error) {
      console.error('Failed to get SOS history:', error);
      return [];
    }
  }, []);

  /**
   * Clear SOS history
   */
  const clearHistory = useCallback(async () => {
    try {
      await SOSService.clearSOSHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, []);

  /**
   * Get report from last SOS event
   */
  const getLastSOSReport = useCallback((): string | null => {
    if (!lastEventRef.current) {
      return null;
    }

    return SOSService.generateSOSReport(lastEventRef.current);
  }, []);

  return {
    // State
    ...systemState,
    countdown,

    // Controls
    startSOS,
    cancelSOS,
    retryLastSOS,
    getSOSHistory,
    clearHistory,
    getLastSOSReport,

    // Profile validation
    isProfileValid: validateProfile().valid,
    profileValidationError: validateProfile().error,
  };
};
