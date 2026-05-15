import React, { useEffect, useMemo, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppTheme, useTheme } from '../theme';

const NOTE_KEY = '@A1_communication_pad_v2';

const PRESET_PHRASES = [
  'I need help.',
  'Please call my emergency contact.',
  'I am deaf and cannot speak.',
  'I need medical assistance.',
  'Please give me space.',
  'I use a wheelchair.',
];

type StrokePoint = {
  x: number;
  y: number;
};

type Stroke = {
  points: StrokePoint[];
  color: string;
  width: number;
};

type SavedPadState = {
  message: string;
  strokes: Stroke[];
};

const buildPath = (points: StrokePoint[]) => {
  if (points.length === 0) {
    return '';
  }

  const [firstPoint, ...restPoints] = points;
  return [`M ${firstPoint.x} ${firstPoint.y}`, ...restPoints.map((point) => `L ${point.x} ${point.y}`)].join(' ');
};

export const NotepadScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [message, setMessage] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(NOTE_KEY)
      .then((stored) => {
        if (!mounted || !stored) {
          return;
        }

        const parsed = JSON.parse(stored) as Partial<SavedPadState>;
        setMessage(typeof parsed.message === 'string' ? parsed.message : '');
        setStrokes(Array.isArray(parsed.strokes) ? parsed.strokes : []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      AsyncStorage.setItem(NOTE_KEY, JSON.stringify({ message, strokes })).catch(() => undefined);
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [isHydrated, message, strokes]);

  const chooseVoice = useMemo(
    () => async () => {
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const preferredFemale = voices.find((voice) => {
        const label = `${voice.name ?? ''} ${voice.language ?? ''}`.toLowerCase();
        return label.includes('female') && label.startsWith('en');
      });
      const preferredEnglish = voices.find((voice) => `${voice.language ?? ''}`.toLowerCase().startsWith('en'));

      return preferredFemale ?? preferredEnglish ?? voices[0] ?? null;
    },
    [],
  );

  const speakText = async (text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      Alert.alert('Nothing to speak', 'Type a message or pick a preset phrase first.');
      return;
    }

    try {
      setIsSpeaking(true);
      const voice = await chooseVoice();

      Speech.stop();
      Speech.speak(trimmedText, {
        language: voice?.language || 'en-US',
        voice: voice?.identifier,
        rate: 0.9,
        pitch: 0.95,
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  const appendPhrase = (phrase: string) => {
    const nextMessage = message.trim() ? `${message.trim()}\n${phrase}` : phrase;
    setMessage(nextMessage);
    speakText(phrase).catch(() => undefined);
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(NOTE_KEY, JSON.stringify({ message, strokes }));
      Alert.alert('Saved', 'Notes and sketch saved locally.');
    } catch {
      Alert.alert('Save failed', 'Could not save notes right now.');
    }
  };

  const clearMessage = () => {
    setMessage('');
  };

  const clearSketch = () => {
    setStrokes([]);
  };

  const clearAll = () => {
    setMessage('');
    setStrokes([]);
    AsyncStorage.removeItem(NOTE_KEY).catch(() => undefined);
  };

  const sketchPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setStrokes((current) => [
            ...current,
            {
              points: [{ x: locationX, y: locationY }],
              color: theme.colors.text,
              width: 3,
            },
          ]);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;

          setStrokes((current) => {
            if (current.length === 0) {
              return current;
            }

            const next = [...current];
            const lastStroke = next[next.length - 1];
            next[next.length - 1] = {
              ...lastStroke,
              points: [...lastStroke.points, { x: locationX, y: locationY }],
            };
            return next;
          });
        },
      }),
    [theme.colors.text],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Quick notes and communication screen"
    >
      <Text style={styles.title} accessibilityRole="header">
        Quick Notepad
      </Text>
      <Text style={styles.subtitle}>Write a note, tap a preset phrase to speak it aloud, or sketch a quick symbol.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.input}
          placeholder="Type a quick message for the people around you"
          placeholderTextColor={theme.colors.textSubtle}
          accessibilityLabel="Quick message notepad"
          accessibilityHint="Large editable text area that saves automatically to the device"
        />

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
            onPress={clearMessage}
            accessibilityRole="button"
            accessibilityLabel="Clear message"
          >
            <Text style={styles.secondaryButtonText}>Clear</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save message"
          >
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Preset Phrases</Text>
        {PRESET_PHRASES.map((phrase) => (
          <Pressable
            key={phrase}
            style={({ pressed }) => [styles.phraseButton, pressed ? styles.pressed : null]}
            onPress={() => appendPhrase(phrase)}
            accessibilityRole="button"
            accessibilityLabel={`Speak phrase: ${phrase}`}
          >
            <Text style={styles.phraseText}>{phrase}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Quick Sketch</Text>
          <Pressable onPress={clearSketch} accessibilityRole="button" accessibilityLabel="Clear sketch area">
            <Text style={styles.inlineAction}>Clear sketch</Text>
          </Pressable>
        </View>

        <View style={styles.sketchPad} {...sketchPanResponder.panHandlers} accessible accessibilityRole="image" accessibilityLabel="Sketch pad">
          {strokes.length === 0 ? <Text style={styles.sketchHint}>Draw a symbol or direction here.</Text> : null}
          <Svg style={styles.sketchSvg} pointerEvents="none">
            {strokes.map((stroke, index) =>
              stroke.points.length > 1 ? (
                <Path key={`stroke-${index}`} d={buildPath(stroke.points)} stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ) : (
                <Circle key={`stroke-${index}`} cx={stroke.points[0].x} cy={stroke.points[0].y} r={stroke.width / 2} fill={stroke.color} />
              ),
            )}
          </Svg>
        </View>
      </View>

      

      <Pressable
        style={({ pressed }) => [styles.ghostButton, pressed ? styles.pressed : null]}
        onPress={clearAll}
        accessibilityRole="button"
        accessibilityLabel="Clear all notes and sketches"
      >
        <Text style={styles.ghostButtonText}>Clear all locally saved content</Text>
      </Pressable>
    </ScrollView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 32, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 8, marginBottom: 18, fontSize: 15, lineHeight: 22, color: theme.colors.textMuted },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  label: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  input: { minHeight: 170, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, borderRadius: 16, padding: 14, color: theme.colors.text, fontSize: 18, lineHeight: 26, textAlignVertical: 'top', backgroundColor: theme.colors.inputBackground },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
  primaryButtonText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 15 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border },
  secondaryButtonText: { color: theme.colors.secondaryText, fontWeight: '800', fontSize: 15 },
  phraseButton: { minHeight: 52, justifyContent: 'center', borderRadius: 14, paddingHorizontal: 12, marginBottom: 8, backgroundColor: theme.colors.chipBackground, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.chipBorder },
  phraseText: { color: theme.colors.chipText, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inlineAction: { color: theme.colors.primary, fontWeight: '800' },
  sketchPad: { minHeight: 220, borderRadius: 18, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: 'hidden', justifyContent: 'center' },
  sketchSvg: { ...StyleSheet.absoluteFillObject },
  sketchHint: { alignSelf: 'center', color: theme.colors.textSubtle, fontSize: 15, fontWeight: '600' },
  ttsButton: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, marginBottom: 12 },
  ttsButtonText: { color: theme.colors.accentText, fontSize: 16, fontWeight: '800' },
  ghostButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border },
  ghostButtonText: { color: theme.colors.secondaryText, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.92 },
});
