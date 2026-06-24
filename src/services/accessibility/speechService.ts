import * as Speech from 'expo-speech';

export type SpeechLanguage = 'en-IN' | 'hi-IN' | 'mr-IN' | 'en-US';

export type SpeechVoiceSettings = {
  preferredVoiceId?: string;
  speechRate: number;
  pitch: number;
  volume: number;
};

type SpeechOptions = {
  force?: boolean;
  interrupt?: boolean;
  key?: string;
  minRepeatMs?: number;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: SpeechLanguage;
  communication?: boolean;
};

type SpeechRequest = {
  text: string;
  options?: SpeechOptions;
};

let lastText = '';
let lastKey = '';
let lastStartedAt = 0;
let lastSpeechText = '';
let isSpeaking = false;
let queue: SpeechRequest[] = [];
let cachedVoices: Speech.Voice[] | undefined;
let voiceSettings: SpeechVoiceSettings = {
  speechRate: 0.8,
  pitch: 0.98,
  volume: 0.92,
};

const DEFAULT_REPEAT_MS = 4500;

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

const voiceText = (voice: Speech.Voice) =>
  `${voice.identifier ?? ''} ${voice.name ?? ''} ${voice.language ?? ''}`.toLowerCase();

const isIndianEnglishVoice = (voice: Speech.Voice) => {
  const text = voiceText(voice);
  return (
    voice.language?.toLowerCase() === 'en-in' ||
    text.includes('en-in') ||
    text.includes('english india') ||
    text.includes('indian english') ||
    text.includes('india')
  );
};

const isFemaleVoice = (voice: Speech.Voice) => {
  const text = voiceText(voice);
  return text.includes('female') || text.includes('woman') || text.includes('women') || text.includes('feminine');
};

const matchesLanguage = (voice: Speech.Voice, language: SpeechLanguage) => {
  const normalizedLanguage = language.toLowerCase();
  const text = voiceText(voice);
  return voice.language?.toLowerCase() === normalizedLanguage || text.includes(normalizedLanguage);
};

const languageFallbacks = (language: SpeechLanguage) => {
  if (language === 'hi-IN') {
    return ['hi-IN', 'hi', 'en-IN', 'en'] as const;
  }

  if (language === 'mr-IN') {
    return ['mr-IN', 'mr', 'hi-IN', 'hi', 'en-IN', 'en'] as const;
  }

  return ['en-IN', 'en'] as const;
};

const getAvailableVoices = async () => {
  if (!cachedVoices) {
    cachedVoices = await Speech.getAvailableVoicesAsync().catch(() => []);
  }

  return cachedVoices;
};

const findLanguageVoice = (voices: Speech.Voice[], language: SpeechLanguage) => {
  const fallbacks = languageFallbacks(language);

  for (const fallback of fallbacks) {
    const normalized = fallback.toLowerCase();
    const match =
      voices.find((voice) => isFemaleVoice(voice) && voiceText(voice).includes(normalized)) ??
      voices.find((voice) => voiceText(voice).includes(normalized));

    if (match) {
      return match;
    }
  }

  return undefined;
};

const getPreferredVoice = async (language: SpeechLanguage = 'en-IN') => {
  const voices = await getAvailableVoices();
  const selectedVoice = voices.find((voice) => voice.identifier === voiceSettings.preferredVoiceId);

  if (selectedVoice && (language === 'en-IN' || matchesLanguage(selectedVoice, language))) {
    return selectedVoice;
  }

  if (language === 'hi-IN' || language === 'mr-IN') {
    return findLanguageVoice(voices, language) ?? selectedVoice ?? voices[0];
  }

  return (
    voices.find((voice) => isIndianEnglishVoice(voice) && isFemaleVoice(voice)) ??
    voices.find(isIndianEnglishVoice) ??
    voices.find((voice) => `${voice.language ?? ''}`.toLowerCase().startsWith('en') && isFemaleVoice(voice)) ??
    selectedVoice ??
    voices.find((voice) => `${voice.language ?? ''}`.toLowerCase().startsWith('en')) ??
    voices[0]
  );
};

const shouldSkipDuplicate = (text: string, options?: SpeechOptions) => {
  if (options?.force) {
    return false;
  }

  const now = Date.now();
  const repeatWindow = options?.minRepeatMs ?? DEFAULT_REPEAT_MS;
  const key = options?.key ?? text;

  return key === lastKey && text === lastText && now - lastStartedAt < repeatWindow;
};

const runSpeech = async (text: string, options?: SpeechOptions) => {
  const language = options?.language ?? 'en-IN';
  const voice = await getPreferredVoice(language);
  const communicationVolume = Math.min(1, voiceSettings.volume + 0.08);

  return new Promise<void>((resolve) => {
    isSpeaking = true;
    lastText = text;
    lastKey = options?.key ?? text;
    lastStartedAt = Date.now();
    lastSpeechText = text;

    Speech.speak(text, {
      language: voice?.language || language,
      voice: voice?.identifier,
      rate: options?.rate ?? (options?.communication ? Math.min(voiceSettings.speechRate, 0.78) : voiceSettings.speechRate),
      pitch: options?.pitch ?? voiceSettings.pitch,
      volume: options?.volume ?? (options?.communication ? communicationVolume : voiceSettings.volume),
      onDone: () => {
        isSpeaking = false;
        resolve();
        playNext().catch(() => undefined);
      },
      onStopped: () => {
        isSpeaking = false;
        resolve();
      },
      onError: () => {
        isSpeaking = false;
        resolve();
        playNext().catch(() => undefined);
      },
    });
  });
};

export const configureSpeech = (settings: SpeechVoiceSettings) => {
  voiceSettings = settings;
};

export const getVoices = async (refresh = false) => {
  if (refresh) {
    cachedVoices = undefined;
  }

  return getAvailableVoices();
};

export const describeVoice = (voice?: Speech.Voice) => {
  if (!voice) {
    return 'System default voice';
  }

  return `${voice.name || voice.identifier} (${voice.language || 'unknown language'})`;
};

const playNext = async () => {
  if (isSpeaking || queue.length === 0) {
    return;
  }

  const next = queue.shift();
  if (!next) {
    return;
  }

  await runSpeech(next.text, next.options);
};

export const stopSpeaking = () => {
  queue = [];
  isSpeaking = false;
  Speech.stop();
};

export const speak = async (text: string, options?: SpeechOptions) => {
  const trimmed = normalize(text);

  if (!trimmed || shouldSkipDuplicate(trimmed, options)) {
    return;
  }

  if (options?.interrupt ?? true) {
    stopSpeaking();
    await runSpeech(trimmed, options);
    return;
  }

  queueSpeech(trimmed, options);
};

export const queueSpeech = (text: string, options?: SpeechOptions) => {
  const trimmed = normalize(text);

  if (!trimmed || shouldSkipDuplicate(trimmed, options)) {
    return;
  }

  queue = [...queue.filter((item) => item.text !== trimmed), { text: trimmed, options }];
  playNext().catch(() => undefined);
};

export const replayLastSpeech = async () => {
  if (!lastSpeechText) {
    return;
  }

  await speak(lastSpeechText, { force: true, interrupt: true });
};

export const speechService = {
  speak,
  stopSpeaking,
  queueSpeech,
  replayLastSpeech,
  configureSpeech,
  getVoices,
  describeVoice,
};
