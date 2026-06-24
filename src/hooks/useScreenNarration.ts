import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { speechService } from '../services/accessibility/speechService';

type ScreenNarrationConfig = {
  title: string;
  description?: string | string[];
  enabled?: boolean;
  focusDelayMs?: number;
  repeatAfterMs?: number;
};

const buildNarrationText = (title: string, description?: string | string[]) => {
  const parts = [
    title,
    ...(Array.isArray(description) ? description : description ? [description] : []),
  ]
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.join('. ');
};

export const useScreenNarration = ({
  title,
  description,
  enabled = true,
  focusDelayMs = 450,
  repeatAfterMs = 30000,
}: ScreenNarrationConfig) => {
  const { isMuted, preferences, textScale } = useAccessibility();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const narrationText = useMemo(() => buildNarrationText(title, description), [description, title]);
  const narrationTextRef = useRef(narrationText);
  const shouldNarrate = enabled && preferences.autoReadScreens && preferences.voiceGuidance && !isMuted;

  useEffect(() => {
    narrationTextRef.current = narrationText;
  }, [narrationText]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldNarrate || !narrationTextRef.current) {
        speechService.stopSpeaking();
        return () => undefined;
      }

      timeoutRef.current = setTimeout(() => {
        speechService.speak(narrationTextRef.current, {
          interrupt: true,
          key: `screen:${title}`,
          minRepeatMs: repeatAfterMs,
          rate: textScale > 1 ? 0.78 : 0.82,
        }).catch(() => undefined);
      }, focusDelayMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        speechService.stopSpeaking();
      };
    }, [focusDelayMs, repeatAfterMs, shouldNarrate, textScale, title]),
  );
};
