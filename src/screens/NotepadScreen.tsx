import React, { useEffect, useMemo, useState } from 'react';
import { Alert, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAccessibility } from '../context/AccessibilityContext';
import { useScreenNarration } from '../hooks/useScreenNarration';
import { AppTheme, useTheme } from '../theme';

const NOTE_KEY = '@A1_communication_pad_v2';

const PRESET_PHRASES = {
  English: [
    'I need help.',
    'Please call my emergency contact.',
    'I am deaf and cannot speak.',
    'I need medical assistance.',
    'Please give me space.',
    'I use a wheelchair.',
  ],
  Hindi: [
    'मुझे मदद चाहिए।',
    'कृपया मेरे आपातकालीन संपर्क को फोन करें।',
    'मैं सुन नहीं सकता और बोल नहीं सकता।',
    'मुझे चिकित्सा सहायता चाहिए।',
    'कृपया मुझे थोड़ी जगह दें।',
    'मैं व्हीलचेयर का उपयोग करता हूं।',
  ],
  Marathi: [
    'मला मदत हवी आहे.',
    'कृपया माझ्या आपत्कालीन संपर्काला फोन करा.',
    'मी ऐकू शकत नाही आणि बोलू शकत नाही.',
    'मला वैद्यकीय मदत हवी आहे.',
    'कृपया मला थोडी जागा द्या.',
    'मी व्हीलचेअर वापरतो.',
  ],
};

type PhraseLanguage = keyof typeof PRESET_PHRASES;

PRESET_PHRASES.English = [
  'Please help me.',
  'Please help me reach the entrance.',
  'I need wheelchair access.',
  'Please speak slowly.',
  'I cannot hear properly.',
  'Please guide me.',
  'Please call my emergency contact.',
  'I need medical assistance.',
  'Please give me space.',
];

PRESET_PHRASES.Hindi = [
  'कृपया मेरी मदद कीजिए।',
  'कृपया मुझे प्रवेश द्वार तक पहुंचने में मदद करें।',
  'मुझे व्हीलचेयर की सुविधा चाहिए।',
  'कृपया धीरे बोलिए।',
  'मुझे ठीक से सुनाई नहीं देता।',
  'कृपया मुझे रास्ता दिखाइए।',
  'कृपया मेरे आपातकालीन संपर्क को फोन करें।',
  'मुझे चिकित्सा सहायता चाहिए।',
  'कृपया मुझे थोड़ी जगह दें।',
];

PRESET_PHRASES.Marathi = [
  'कृपया मला मदत करा.',
  'कृपया मला प्रवेशद्वारापर्यंत पोहोचायला मदत करा.',
  'मला व्हीलचेअर प्रवेश हवा आहे.',
  'कृपया हळू बोला.',
  'मला नीट ऐकू येत नाही.',
  'कृपया मला मार्गदर्शन करा.',
  'कृपया माझ्या आपत्कालीन संपर्काला फोन करा.',
  'मला वैद्यकीय मदत हवी आहे.',
  'कृपया मला थोडी जागा द्या.',
];

const PHRASE_LANGUAGE_CODE: Record<PhraseLanguage, 'en-IN' | 'hi-IN' | 'mr-IN'> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Marathi: 'mr-IN',
};

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
  const { minTouchTarget, speak, stopSpeaking, textScale } = useAccessibility();
  const styles = useMemo(() => createStyles(theme, textScale, minTouchTarget), [minTouchTarget, textScale, theme]);
  const [message, setMessage] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [language, setLanguage] = useState<PhraseLanguage>('English');

  useScreenNarration({
    title: 'Communication Notepad',
    description: [
      'Use the large message box to type a note for people around you.',
      `Preset phrases are available in ${Object.keys(PRESET_PHRASES).join(', ')}.`,
      'Tap a phrase to add it to your note and speak it aloud.',
      'Voice to text uses Android keyboard dictation.',
      message.trim() ? 'A typed message is currently saved in the note box.' : 'The note box is empty.',
    ],
    enabled: isHydrated,
  });

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

  const speakText = async (text: string, phraseLanguage: PhraseLanguage = language) => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      Alert.alert('Nothing to speak', 'Type a message or pick a preset phrase first.');
      return;
    }

    await speak(trimmedText, {
      force: true,
      language: PHRASE_LANGUAGE_CODE[phraseLanguage],
      communication: true,
      key: `communication:${phraseLanguage}:${trimmedText}`,
    });
  };

  const appendPhrase = (phrase: string) => {
    const nextMessage = message.trim() ? `${message.trim()}\n${phrase}` : phrase;
    setMessage(nextMessage);
    speakText(phrase, language).catch(() => undefined);
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

  const handleVoiceToText = () => {
    Alert.alert(
      'Voice to text',
      'This Expo build does not include a stable offline speech-to-text module. The typed message box is ready for dictation from the Android keyboard microphone.',
    );
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

  useEffect(() => stopSpeaking, [stopSpeaking]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Quick notes and communication screen"
    >
      <Text style={styles.title} accessibilityRole="header">
        Communication Notepad
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
            onPress={handleVoiceToText}
            accessibilityRole="button"
            accessibilityLabel="Voice to text"
            accessibilityHint="Use Android keyboard dictation to enter spoken text"
          >
            <Text style={styles.secondaryButtonText}>Voice to text</Text>
          </Pressable>
        </View>

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
        <Pressable
          style={({ pressed }) => [styles.ttsButton, pressed ? styles.pressed : null]}
          onPress={() => speakText(message).catch(() => undefined)}
          accessibilityRole="button"
          accessibilityLabel="Speak typed message aloud"
        >
          <Text style={styles.ttsButtonText}>Speak typed message</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Quick Communication Phrases</Text>
        <View style={styles.languageTabs} accessibilityRole="tablist">
          {(Object.keys(PRESET_PHRASES) as PhraseLanguage[]).map((item) => (
            <Pressable
              key={item}
              style={({ pressed }) => [styles.languageTab, language === item ? styles.languageTabActive : null, pressed ? styles.pressed : null]}
              onPress={() => setLanguage(item)}
              accessibilityRole="tab"
              accessibilityState={{ selected: language === item }}
              accessibilityLabel={`${item} phrases`}
              accessibilityHint={`Show preset phrases in ${item}`}
            >
              <Text style={[styles.languageText, language === item ? styles.languageTextActive : null]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {PRESET_PHRASES[language].map((phrase) => (
          <Pressable
            key={phrase}
            style={({ pressed }) => [styles.phraseButton, pressed ? styles.pressed : null]}
            onPress={() => appendPhrase(phrase)}
            accessibilityRole="button"
            accessibilityLabel={`Speak phrase: ${phrase}`}
            accessibilityHint="Adds this phrase to the note and speaks it aloud"
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

const createStyles = (theme: AppTheme, textScale: number, minTouchTarget: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 32 * textScale, fontWeight: '900', color: theme.colors.text },
  subtitle: { marginTop: 8, marginBottom: 18, fontSize: 15 * textScale, lineHeight: 22 * textScale, color: theme.colors.textMuted },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  label: { fontSize: 15 * textScale, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  input: { minHeight: 170, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, borderRadius: 16, padding: 14, color: theme.colors.text, fontSize: 18 * textScale, lineHeight: 26 * textScale, textAlignVertical: 'top', backgroundColor: theme.colors.inputBackground },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: { flex: 1, minHeight: Math.max(52, minTouchTarget), borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
  primaryButtonText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: 15 * textScale },
  secondaryButton: { flex: 1, minHeight: Math.max(52, minTouchTarget), borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border, paddingHorizontal: 8 },
  secondaryButtonText: { color: theme.colors.secondaryText, fontWeight: '800', fontSize: 15 * textScale, textAlign: 'center' },
  languageTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  languageTab: { flex: 1, minHeight: Math.max(44, minTouchTarget), alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border },
  languageTabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  languageText: { color: theme.colors.secondaryText, fontSize: 13 * textScale, fontWeight: '900' },
  languageTextActive: { color: theme.colors.primaryText },
  phraseButton: { minHeight: Math.max(52, minTouchTarget), justifyContent: 'center', borderRadius: 14, paddingHorizontal: 12, marginBottom: 8, backgroundColor: theme.colors.chipBackground, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.chipBorder },
  phraseText: { color: theme.colors.chipText, fontSize: 15 * textScale, fontWeight: '700', lineHeight: 21 * textScale },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inlineAction: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 * textScale },
  sketchPad: { minHeight: 220, borderRadius: 18, borderWidth: theme.isHighContrast ? 2 : 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: 'hidden', justifyContent: 'center' },
  sketchSvg: { ...StyleSheet.absoluteFillObject },
  sketchHint: { alignSelf: 'center', color: theme.colors.textSubtle, fontSize: 15 * textScale, fontWeight: '600' },
  ttsButton: { minHeight: Math.max(56, minTouchTarget), borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, marginTop: 12 },
  ttsButtonText: { color: theme.colors.accentText, fontSize: 16 * textScale, fontWeight: '800' },
  ghostButton: { minHeight: Math.max(52, minTouchTarget), borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondary, borderWidth: theme.isHighContrast ? 2 : 0, borderColor: theme.colors.border, paddingHorizontal: 12 },
  ghostButtonText: { color: theme.colors.secondaryText, fontSize: 14 * textScale, fontWeight: '800', textAlign: 'center' },
  pressed: { opacity: 0.92 },
});
