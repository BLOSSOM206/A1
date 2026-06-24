import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, DevSettings } from 'react-native';
import { AuthStore } from '../authStore';
import { clearBookings } from '../bookingsStore';
import { STORAGE_KEYS } from '../../constants/sosConfig';
import { EmergencyProfileStore } from '../emergency/emergencyProfileStore';

const ACCESSIBILITY_STORAGE_KEY = '@A1_accessibility_profile_v1';
const ACCESSIBILITY_MUTED_KEY = '@A1_accessibility_voice_muted_v1';
const THEME_STORAGE_KEY = '@A1_accessibility_theme_v1';
const NOTE_STORAGE_KEY = '@A1_communication_pad_v2';
const AUTH_ACCOUNT_KEY = '@A1_auth_account';
const AUTH_SESSION_KEY = '@A1_auth_session';
const BOOKINGS_KEY = '@my_bookings_v1';
const SOS_HISTORY_KEY = 'sos_event_history';

const DYNAMIC_KEY_PREFIXES = ['@A1_restaurant_reviews_', '@A1_'];

const localStorageKeys = [
  ACCESSIBILITY_STORAGE_KEY,
  ACCESSIBILITY_MUTED_KEY,
  THEME_STORAGE_KEY,
  NOTE_STORAGE_KEY,
  AUTH_ACCOUNT_KEY,
  AUTH_SESSION_KEY,
  BOOKINGS_KEY,
  SOS_HISTORY_KEY,
  STORAGE_KEYS.EMERGENCY_PROFILE,
  STORAGE_KEYS.EMERGENCY_CONTACTS,
  STORAGE_KEYS.SOS_EVENTS_LOG,
  STORAGE_KEYS.LAST_KNOWN_LOCATION,
];

const getDynamicStorageKeys = async (): Promise<string[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((key) => DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)));
  } catch {
    return [];
  }
};

const optionalClearers = [
  async () => {
    try {
      const secureStore = require('expo-secure-store') as {
        deleteItemAsync?: (key: string) => Promise<void>;
        getItemAsync?: (key: string) => Promise<string | null>;
      };

      if (!secureStore?.deleteItemAsync || !secureStore?.getItemAsync) {
        return;
      }

      const secureKeys = [
        'A1Clean',
        'a1clean',
        ACCESSIBILITY_STORAGE_KEY,
        ACCESSIBILITY_MUTED_KEY,
        THEME_STORAGE_KEY,
        NOTE_STORAGE_KEY,
        ...localStorageKeys,
      ];

      await Promise.all(
        Array.from(new Set(secureKeys)).map(async (key) => {
          try {
            const value = await secureStore.getItemAsync(key);
            if (value != null) {
              await secureStore.deleteItemAsync(key);
            }
          } catch {
            return;
          }
        }),
      );
    } catch {
      return;
    }
  },
  async () => {
    try {
      const mmkvModule = require('react-native-mmkv') as {
        MMKV?: new () => { clearAll?: () => void };
      };

      if (!mmkvModule?.MMKV) {
        return;
      }

      const storage = new mmkvModule.MMKV();
      storage.clearAll?.();
    } catch {
      return;
    }
  },
];

const reloadApp = () => {
  if (typeof DevSettings?.reload === 'function') {
    DevSettings.reload();
    return;
  }

  NativeModules.DevSettings?.reload?.();
};

export async function clearAllLocalData(): Promise<void> {
  await Promise.allSettled([
    AuthStore.clearAccount(),
    clearBookings(),
    EmergencyProfileStore.clearAllData(),
  ]);

  await Promise.allSettled(optionalClearers.map((clearer) => clearer()));

  const dynamicKeys = await getDynamicStorageKeys();
  if (dynamicKeys.length > 0) {
    await AsyncStorage.multiRemove(dynamicKeys);
  }

  await AsyncStorage.multiRemove(localStorageKeys);
  await AsyncStorage.clear();
}

export async function resetAppState(): Promise<void> {
  await clearAllLocalData();
  reloadApp();
}