import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Voice } from 'expo-speech';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';
import { SpeechLanguage, SpeechVoiceSettings, speechService } from '../services/accessibility/speechService';
import { ThemeMode, useTheme } from '../theme';

export type AccessibilityNeed =
  | 'blindLowVision'
  | 'hearingImpairment'
  | 'mobilityImpairment'
  | 'cognitiveDifferences'
  | 'speechDisability'
  | 'elderlyAssistance'
  | 'neurodivergentSupport';

export type AccessibilityPreferences = {
  darkMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceGuidance: boolean;
  vibrationFeedback: boolean;
  simplifiedUi: boolean;
  autoReadScreens: boolean;
  biggerButtons: boolean;
  oneHandedNavigation: boolean;
};

export type AccessibilitySettingsState = {
  onboardingComplete: boolean;
  needs: AccessibilityNeed[];
  preferences: AccessibilityPreferences;
  voiceSettings: SpeechVoiceSettings;
};

type AccessibilityContextValue = AccessibilitySettingsState & {
  isLoading: boolean;
  isMuted: boolean;
  textScale: number;
  spacingScale: number;
  minTouchTarget: number;
  availableVoices: Voice[];
  voiceSettings: SpeechVoiceSettings;
  setNeeds: (needs: AccessibilityNeed[]) => Promise<void>;
  toggleNeed: (need: AccessibilityNeed) => Promise<void>;
  updatePreference: <TKey extends keyof AccessibilityPreferences>(
    key: TKey,
    value: AccessibilityPreferences[TKey],
  ) => Promise<void>;
  savePreferences: (preferences: AccessibilityPreferences) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  speak: (text: string, options?: { force?: boolean; interrupt?: boolean; key?: string; minRepeatMs?: number; language?: SpeechLanguage; communication?: boolean }) => Promise<void>;
  stopSpeaking: () => void;
  queueSpeech: (text: string, options?: { force?: boolean; key?: string; minRepeatMs?: number; language?: SpeechLanguage; communication?: boolean }) => void;
  replayLastSpeech: () => Promise<void>;
  refreshVoices: () => Promise<void>;
  saveVoiceSettings: (settings: SpeechVoiceSettings) => Promise<void>;
  toggleMute: () => Promise<void>;
  notify: (message?: string) => void;
};

const STORAGE_KEY = '@A1_accessibility_profile_v1';
const MUTED_KEY = '@A1_accessibility_voice_muted_v1';

export const defaultPreferences: AccessibilityPreferences = {
  darkMode: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  voiceGuidance: true,
  vibrationFeedback: true,
  simplifiedUi: false,
  autoReadScreens: true,
  biggerButtons: false,
  oneHandedNavigation: false,
};

const defaultState: AccessibilitySettingsState = {
  onboardingComplete: false,
  needs: [],
  preferences: defaultPreferences,
  voiceSettings: {
    speechRate: 0.8,
    pitch: 0.98,
    volume: 0.92,
  },
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const unique = <T,>(items: T[]) => Array.from(new Set(items));

export const buildPreferencesForNeeds = (
  needs: AccessibilityNeed[],
  current: AccessibilityPreferences = defaultPreferences,
): AccessibilityPreferences => {
  const next = { ...current };

  if (needs.includes('blindLowVision')) {
    next.highContrast = true;
    next.largeText = true;
    next.biggerButtons = true;
    next.simplifiedUi = true;
    next.voiceGuidance = true;
    next.autoReadScreens = true;
    next.vibrationFeedback = true;
  }

  if (needs.includes('hearingImpairment')) {
    next.vibrationFeedback = true;
    next.voiceGuidance = false;
  }

  if (needs.includes('mobilityImpairment')) {
    next.biggerButtons = true;
    next.oneHandedNavigation = true;
    next.reducedMotion = true;
  }

  if (needs.includes('cognitiveDifferences') || needs.includes('neurodivergentSupport')) {
    next.simplifiedUi = true;
    next.reducedMotion = true;
  }

  if (needs.includes('speechDisability')) {
    next.voiceGuidance = true;
  }

  if (needs.includes('elderlyAssistance')) {
    next.highContrast = true;
    next.largeText = true;
    next.biggerButtons = true;
    next.simplifiedUi = true;
    next.reducedMotion = true;
  }

  return next;
};

const isNeed = (value: unknown): value is AccessibilityNeed =>
  value === 'blindLowVision' ||
  value === 'hearingImpairment' ||
  value === 'mobilityImpairment' ||
  value === 'cognitiveDifferences' ||
  value === 'speechDisability' ||
  value === 'elderlyAssistance' ||
  value === 'neurodivergentSupport';

const parseStoredState = (stored: string | null): AccessibilitySettingsState => {
  if (!stored) {
    return defaultState;
  }

  const parsed = JSON.parse(stored) as Partial<AccessibilitySettingsState>;
  return {
    onboardingComplete: Boolean(parsed.onboardingComplete),
    needs: Array.isArray(parsed.needs) ? unique(parsed.needs.filter(isNeed)) : [],
    preferences: {
      ...defaultPreferences,
      ...(parsed.preferences ?? {}),
    },
    voiceSettings: {
      ...defaultState.voiceSettings,
      ...(parsed.voiceSettings ?? {}),
    },
  };
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setMode, setHighContrast } = useTheme();
  const [state, setState] = useState<AccessibilitySettingsState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const didHydrateRef = useRef(false);

  const persistState = useCallback(async (nextState: AccessibilitySettingsState) => {
    setState(nextState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const applyThemePreferences = useCallback(
    async (preferences: AccessibilityPreferences) => {
      const nextMode: ThemeMode = preferences.darkMode ? 'dark' : 'light';
      await Promise.all([
        setMode(nextMode),
        setHighContrast(preferences.highContrast),
      ]);
    },
    [setHighContrast, setMode],
  );

  useEffect(() => {
    if (didHydrateRef.current) {
      return undefined;
    }

    didHydrateRef.current = true;
    let mounted = true;

    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(MUTED_KEY)])
      .then(async ([storedState, storedMuted]) => {
        if (!mounted) {
          return;
        }

        const nextState = parseStoredState(storedState);
        setState(nextState);
        speechService.configureSpeech(nextState.voiceSettings);
        setIsMuted(storedMuted === 'true');
        await applyThemePreferences(nextState.preferences);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      speechService.stopSpeaking();
    };
  }, [applyThemePreferences]);

  const refreshVoices = useCallback(async () => {
    const voices = await speechService.getVoices(true);
    setAvailableVoices(voices);
  }, []);

  useEffect(() => {
    refreshVoices().catch(() => undefined);
  }, [refreshVoices]);

  const savePreferences = useCallback(
    async (preferences: AccessibilityPreferences) => {
      const nextState = { ...state, preferences };
      await persistState(nextState);
      await applyThemePreferences(preferences);
    },
    [applyThemePreferences, persistState, state],
  );

  const saveVoiceSettings = useCallback(
    async (voiceSettings: SpeechVoiceSettings) => {
      const nextVoiceSettings = {
        ...state.voiceSettings,
        ...voiceSettings,
        speechRate: Math.max(0.55, Math.min(1, voiceSettings.speechRate)),
        pitch: Math.max(0.8, Math.min(1.2, voiceSettings.pitch)),
        volume: Math.max(0.25, Math.min(1, voiceSettings.volume)),
      };
      const nextState = { ...state, voiceSettings: nextVoiceSettings };
      speechService.configureSpeech(nextVoiceSettings);
      await persistState(nextState);
    },
    [persistState, state],
  );

  const setNeeds = useCallback(
    async (needs: AccessibilityNeed[]) => {
      const nextNeeds = unique(needs);
      const preferences = buildPreferencesForNeeds(nextNeeds, state.preferences);
      const nextState = { ...state, needs: nextNeeds, preferences };
      await persistState(nextState);
      await applyThemePreferences(preferences);
    },
    [applyThemePreferences, persistState, state],
  );

  const toggleNeed = useCallback(
    async (need: AccessibilityNeed) => {
      const exists = state.needs.includes(need);
      const nextNeeds = exists ? state.needs.filter((item) => item !== need) : [...state.needs, need];
      await setNeeds(nextNeeds);
    },
    [setNeeds, state.needs],
  );

  const updatePreference = useCallback(
    async <TKey extends keyof AccessibilityPreferences>(key: TKey, value: AccessibilityPreferences[TKey]) => {
      await savePreferences({ ...state.preferences, [key]: value });
    },
    [savePreferences, state.preferences],
  );

  const completeOnboarding = useCallback(async () => {
    await persistState({ ...state, onboardingComplete: true });
  }, [persistState, state]);

  const restartOnboarding = useCallback(async () => {
    await persistState({ ...state, onboardingComplete: false });
  }, [persistState, state]);

  const stopSpeaking = useCallback(() => {
    speechService.stopSpeaking();
  }, []);

  const speak = useCallback(
    async (text: string, options?: { force?: boolean; interrupt?: boolean; key?: string; minRepeatMs?: number; language?: SpeechLanguage; communication?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || isMuted || (!options?.force && !state.preferences.voiceGuidance)) {
        return;
      }

      await speechService.speak(trimmed, {
        ...options,
        rate: state.needs.includes('elderlyAssistance') ? Math.min(state.voiceSettings.speechRate, 0.76) : state.voiceSettings.speechRate,
      });
    },
    [isMuted, state.needs, state.preferences.voiceGuidance, state.voiceSettings.speechRate],
  );

  const queueSpeech = useCallback(
    (text: string, options?: { force?: boolean; key?: string; minRepeatMs?: number; language?: SpeechLanguage; communication?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || isMuted || (!options?.force && !state.preferences.voiceGuidance)) {
        return;
      }

      speechService.queueSpeech(trimmed, {
        ...options,
        interrupt: false,
        rate: state.needs.includes('elderlyAssistance') ? Math.min(state.voiceSettings.speechRate, 0.76) : state.voiceSettings.speechRate,
      });
    },
    [isMuted, state.needs, state.preferences.voiceGuidance, state.voiceSettings.speechRate],
  );

  const replayLastSpeech = useCallback(async () => {
    if (isMuted || !state.preferences.voiceGuidance) {
      return;
    }

    await speechService.replayLastSpeech();
  }, [isMuted, state.preferences.voiceGuidance]);

  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      speechService.stopSpeaking();
    }
    await AsyncStorage.setItem(MUTED_KEY, String(nextMuted));
  }, [isMuted]);

  const notify = useCallback(
    (message?: string) => {
      if (state.preferences.vibrationFeedback) {
        Vibration.vibrate(35);
      }
      if (message) {
        AccessibilityInfo.announceForAccessibility(message);
      }
    },
    [state.preferences.vibrationFeedback],
  );

  const textScale = state.preferences.largeText
    ? state.needs.includes('elderlyAssistance')
      ? 1.28
      : 1.16
    : 1;
  const spacingScale = state.preferences.simplifiedUi || state.preferences.biggerButtons ? 1.12 : 1;
  const minTouchTarget = state.preferences.biggerButtons ? 60 : 48;

  const value = useMemo(
    () => ({
      ...state,
      isLoading,
      isMuted,
      textScale,
      spacingScale,
      minTouchTarget,
      availableVoices,
      voiceSettings: state.voiceSettings,
      setNeeds,
      toggleNeed,
      updatePreference,
      savePreferences,
      completeOnboarding,
      restartOnboarding,
      speak,
      stopSpeaking,
      queueSpeech,
      replayLastSpeech,
      refreshVoices,
      saveVoiceSettings,
      toggleMute,
      notify,
    }),
    [
      completeOnboarding,
      isLoading,
      isMuted,
      availableVoices,
      minTouchTarget,
      notify,
      queueSpeech,
      replayLastSpeech,
      refreshVoices,
      restartOnboarding,
      saveVoiceSettings,
      savePreferences,
      setNeeds,
      spacingScale,
      speak,
      state,
      stopSpeaking,
      textScale,
      toggleMute,
      toggleNeed,
      updatePreference,
    ],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }

  return context;
};
