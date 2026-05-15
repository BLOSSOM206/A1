/**
 * useEmergencyCountdown Hook
 * Manages 5-second SOS countdown with vibration
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Vibration, Platform } from 'react-native';
import { SOSCountdownState } from '../../types/Emergency';
import { SOS_CONFIG } from '../../constants/sosConfig';

export interface UseEmergencyCountdownParams {
  duration?: number; // milliseconds
  autoStart?: boolean;
  onCountdownTick?: (remaining: number) => void;
  onCountdownComplete?: () => void;
  onCountdownCancel?: () => void;
}

export const useEmergencyCountdown = ({
  duration = SOS_CONFIG.COUNTDOWN_DURATION_MS,
  autoStart = false,
  onCountdownTick,
  onCountdownComplete,
  onCountdownCancel,
}: UseEmergencyCountdownParams) => {
  const [state, setState] = useState<SOSCountdownState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(duration / 1000),
  );
  const [remainingMs, setRemainingMs] = useState(duration);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationRef = useRef<boolean>(true);

  const safeVibrate = useCallback((pattern?: number[] | number) => {
    if (!vibrationRef.current) return;

    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        Vibration.vibrate(pattern ?? SOS_CONFIG.VIBRATION_PATTERN_COUNTDOWN);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Vibration unavailable:', error);
      }
      vibrationRef.current = false;
    }
  }, []);

  /**
   * Trigger vibration pattern
   */
  const triggerVibration = useCallback((pattern?: string): void => {
    if (!vibrationRef.current) return;

    if (pattern === 'complete') {
      safeVibrate([0, 200, 100, 200]);
      return;
    }

    if (pattern === 'cancel') {
      safeVibrate([0, 100, 50, 100]);
      return;
    }

    safeVibrate(SOS_CONFIG.VIBRATION_PATTERN_COUNTDOWN);
  }, [safeVibrate]);

  /**
   * Start countdown
   */
  const start = useCallback(() => {
    if (state === 'counting') return; // Already counting

    setState('counting');
    setRemainingMs(duration);
    setRemainingSeconds(Math.ceil(duration / 1000));

    // Initial vibration
    triggerVibration();

    // Update every 100ms for smooth UI
    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const newMs = prev - 100;

        if (newMs <= 0) {
          // Countdown complete
          setState('completed');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setRemainingMs(0);
          setRemainingSeconds(0);
          triggerVibration('complete');
          onCountdownComplete?.();
          return 0;
        }

        const newSeconds = Math.ceil(newMs / 1000);
        setRemainingSeconds(newSeconds);
        onCountdownTick?.(newSeconds);

        // Vibrate on each second transition
        if (newMs % 1000 < 100) {
          triggerVibration();
        }

        return newMs;
      });
    }, 100);
  }, [duration, state, onCountdownComplete, onCountdownTick, triggerVibration]);

  /**
   * Cancel countdown
   */
  const cancel = useCallback(() => {
    if (state !== 'counting') return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState('cancelled');
    setRemainingMs(0);
    setRemainingSeconds(0);

    // Alert vibration for cancellation
    triggerVibration('cancel');
    onCountdownCancel?.();
  }, [state, onCountdownCancel, triggerVibration]);

  /**
   * Pause countdown (can be resumed)
   */
  const pause = useCallback(() => {
    if (state !== 'counting') return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState('idle');
  }, [state]);

  /**
   * Resume countdown from pause
   */
  const resume = useCallback(() => {
    if (state !== 'idle' || remainingMs <= 0) return;

    setState('counting');
    triggerVibration();

    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const newMs = prev - 100;

        if (newMs <= 0) {
          setState('completed');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setRemainingMs(0);
          setRemainingSeconds(0);
          triggerVibration('complete');
          onCountdownComplete?.();
          return 0;
        }

        const newSeconds = Math.ceil(newMs / 1000);
        setRemainingSeconds(newSeconds);
        onCountdownTick?.(newSeconds);

        if (newMs % 1000 < 100) {
          triggerVibration();
        }

        return newMs;
      });
    }, 100);
  }, [state, remainingMs, onCountdownComplete, onCountdownTick, triggerVibration]);

  /**
   * Reset countdown to initial state
   */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState('idle');
    setRemainingMs(duration);
    setRemainingSeconds(Math.ceil(duration / 1000));
  }, [duration]);

  /**
   * Toggle vibration on/off
   */
  const setVibrationEnabled = useCallback((enabled: boolean) => {
    vibrationRef.current = enabled;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (autoStart && state === 'idle') {
      start();
    }
  }, [autoStart, start, state]);

  return {
    state,
    remainingSeconds,
    remainingMs,
    isCountingDown: state === 'counting',
    isCancelled: state === 'cancelled',
    isCompleted: state === 'completed',

    // Controls
    start,
    cancel,
    pause,
    resume,
    reset,
    setVibrationEnabled,
  };
};
