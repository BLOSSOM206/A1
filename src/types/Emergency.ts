/**
 * Emergency/SOS Type Definitions
 * Accessible emergency system for deaf/mute users
 */

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string; // 'family', 'hospital', 'friend', etc.
  priority: number; // 1 = highest (call/SMS first)
}

export interface MedicalInfo {
  allergies: string[];
  conditions: string[]; // e.g., ['diabetic', 'epileptic']
  medications: string[];
  bloodType?: string;
  notes?: string;
}

export interface EmergencyProfile {
  userId: string;
  fullName: string;
  emergencyContactNumber?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalConditions?: string[];
  disabilityType?: string;
  address?: string;
  notes?: string;
  medicalInfo?: MedicalInfo;
  emergencyContacts?: EmergencyContact[];
  canSpeak?: boolean;
  communicationMethod?: 'deaf' | 'mute' | 'both' | 'other';
  lastUpdated: number; // Timestamp
}

export interface LocationSnapshot {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface SOSEvent {
  id: string;
  timestamp: number;
  status: 'initiated' | 'dialing' | 'called' | 'sms_sent' | 'completed' | 'cancelled' | 'failed';
  location: LocationSnapshot | null;
  profile: EmergencyProfile;
  emergencyNumber: string;
  contactsSMS: string[]; // Phone numbers SMS was sent to
  ttsMessageGenerated: boolean;
  errors: string[];
}

export interface TTSMessage {
  text: string;
  audioPath?: string; // Local file path if pre-generated
  duration?: number; // Milliseconds
}

export type SOSCountdownState = 'idle' | 'counting' | 'cancelled' | 'completed';

export interface SOSSystemState {
  isCountingDown: boolean;
  remainingSeconds: number;
  isCalling: boolean;
  lastEvent: SOSEvent | null;
  error: string | null;
}
