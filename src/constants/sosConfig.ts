/**
 * Emergency/SOS Configuration
 * Timing, numbers, and vibration patterns
 */

// SOS Button Configuration
export const SOS_CONFIG = {
  COUNTDOWN_DURATION_MS: 5000, // 5 seconds
  VIBRATION_PATTERN_COUNTDOWN: [0, 100, 80, 100, 80], // Pattern for countdown
  VIBRATION_PATTERN_ALERT: [0, 200, 150, 200], // Alert vibration
  VIBRATION_INTENSITY: 1.0, // 0-1 scale
};

// Emergency Numbers by Region
export const EMERGENCY_NUMBERS = {
  EU: '112', // Universal EU
  UK: '999',
  US: '911',
  INDIA: '112', // Unified in India
};

// Default emergency number if user doesn't specify
export const DEFAULT_EMERGENCY_NUMBER = '112';



// LocalStorage Keys
export const STORAGE_KEYS = {
  EMERGENCY_PROFILE: '@A1_emergency_profile',
  EMERGENCY_CONTACTS: '@A1_emergency_contacts',
  SOS_EVENTS_LOG: '@A1_sos_events_log',
  LAST_KNOWN_LOCATION: '@A1_last_known_location',
};

// Firebase Configuration (will be set during app initialization)
export const FIREBASE_CONFIG = {
  EMERGENCY_EVENTS_COLLECTION: 'emergency_events',
  EMERGENCY_PROFILES_COLLECTION: 'emergency_profiles',
  MAX_EVENTS_STORED_LOCALLY: 50, // Keep last 50 events in storage
};

// Permissions Required
export const REQUIRED_PERMISSIONS = {
  ANDROID: [
    'android.permission.CALL_PHONE',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.SEND_SMS',
  ],
  IOS: [
    'location', // NSLocationWhenInUseUsageDescription
    'contacts', // NSContactsUsageDescription (optional)
  ],
};

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_CALL_RETRIES: 1, // Don't retry auto-dial (user controls)
  MAX_SMS_RETRIES: 3,
  SMS_RETRY_DELAY_MS: 1000,
  LOCATION_TIMEOUT_MS: 10000, // 10 seconds max to get location
};
