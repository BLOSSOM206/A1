/**
 * Emergency Profile Store Service
 * Handles local (AsyncStorage) and cloud (Firebase) storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyProfile, EmergencyContact } from '../../types/Emergency';
import { STORAGE_KEYS } from '../../constants/sosConfig';

export class EmergencyProfileStore {
  /**
   * Save emergency profile locally
   */
  static async saveProfileLocal(profile: EmergencyProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_PROFILE,
        JSON.stringify({
          ...profile,
          lastUpdated: Date.now(),
        }),
      );
      if (profile.emergencyContacts?.length) {
        await this.saveContactsLocal(profile.emergencyContacts);
      }
    } catch (error) {
      console.error('Failed to save emergency profile locally:', error);
      throw new Error('Could not save emergency profile');
    }
  }

  /**
   * Load emergency profile from local storage
   */
  static async loadProfileLocal(): Promise<EmergencyProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_PROFILE);
      if (!stored) return null;
      return JSON.parse(stored) as EmergencyProfile;
    } catch (error) {
      console.error('Failed to load emergency profile locally:', error);
      return null;
    }
  }

  /**
   * Save emergency contacts locally
   */
  static async saveContactsLocal(contacts: EmergencyContact[]): Promise<void> {
    try {
      const sorted = [...contacts].sort((a, b) => a.priority - b.priority);
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(sorted),
      );
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
      throw new Error('Could not save emergency contacts');
    }
  }

  /**
   * Load emergency contacts from local storage
   */
  static async loadContactsLocal(): Promise<EmergencyContact[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
      if (!stored) return [];
      return JSON.parse(stored) as EmergencyContact[];
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      return [];
    }
  }

  /**
   * Check if profile is complete and valid for emergency use
   */
  static validateProfile(profile: EmergencyProfile | null): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    if (!profile) {
      return { isValid: false, missingFields: ['Profile does not exist'] };
    }

    if (!profile.fullName?.trim()) missingFields.push('Full name');
    if (!profile.emergencyContactNumber?.trim()) missingFields.push('Emergency contact number');
    if (!profile.address?.trim()) missingFields.push('Address');

    const allergiesCount = profile.allergies?.length || profile.medicalInfo?.allergies?.length || 0;
    const conditionsCount = profile.medicalConditions?.length || profile.medicalInfo?.conditions?.length || 0;

    if (!profile.bloodGroup?.trim() && !allergiesCount && !conditionsCount) {
      missingFields.push('Blood group or medical details');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Add a single emergency contact
   */
  static async addContact(contact: EmergencyContact): Promise<void> {
    try {
      const existing = await this.loadContactsLocal();
      const updated = [...existing, contact].sort((a, b) => a.priority - b.priority);
      await this.saveContactsLocal(updated);
    } catch (error) {
      console.error('Failed to add emergency contact:', error);
      throw error;
    }
  }

  /**
   * Remove an emergency contact
   */
  static async removeContact(contactId: string): Promise<void> {
    try {
      const contacts = await this.loadContactsLocal();
      const filtered = contacts.filter((c) => c.id !== contactId);
      await this.saveContactsLocal(filtered);
    } catch (error) {
      console.error('Failed to remove emergency contact:', error);
      throw error;
    }
  }

  /**
   * Update an emergency contact
   */
  static async updateContact(contact: EmergencyContact): Promise<void> {
    try {
      const contacts = await this.loadContactsLocal();
      const updated = contacts.map((c) => (c.id === contact.id ? contact : c));
      await this.saveContactsLocal(updated);
    } catch (error) {
      console.error('Failed to update emergency contact:', error);
      throw error;
    }
  }

  /**
   * Get contacts sorted by priority (for sending alerts)
   */
  static async getPrioritizedContacts(): Promise<EmergencyContact[]> {
    try {
      const contacts = await this.loadContactsLocal();
      return contacts.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Failed to get prioritized contacts:', error);
      return [];
    }
  }

  /**
   * Clear all emergency data (use with caution)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EMERGENCY_PROFILE,
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        STORAGE_KEYS.SOS_EVENTS_LOG,
      ]);
    } catch (error) {
      console.error('Failed to clear emergency data:', error);
      throw error;
    }
  }

  /**
   * Export emergency profile as JSON (for backup)
   */
  static async exportProfileData(): Promise<string> {
    try {
      const profile = await this.loadProfileLocal();
      const contacts = await this.loadContactsLocal();
      return JSON.stringify(
        {
          profile,
          contacts,
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      );
    } catch (error) {
      console.error('Failed to export profile data:', error);
      throw error;
    }
  }
}
