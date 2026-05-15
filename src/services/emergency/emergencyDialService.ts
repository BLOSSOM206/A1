/**
 * Emergency Dial Service
 * Handles phone calls and SMS routing
 */

import { Linking, Platform } from 'react-native';
import { EmergencyProfile, LocationSnapshot } from '../../types/Emergency';
import { DEFAULT_EMERGENCY_NUMBER } from '../../constants/sosConfig';

export class EmergencyDialService {
  /**
   * Open phone dialer with emergency number prefilled
   * User must manually confirm the call (security requirement)
   */
  static async openEmergencyDialer(emergencyNumber: string = DEFAULT_EMERGENCY_NUMBER): Promise<void> {
    try {
      const phoneUrl = `tel:${emergencyNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (!canOpen) {
        throw new Error('Phone dialler not available on this device');
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Failed to open dialer:', error);
      throw new Error('Could not open phone dialer');
    }
  }

  /**
   * Send SMS to emergency contact
   * Note: This requires react-native-sms or similar
   * For now, uses Linking URL scheme
   */
  static async sendEmergencySMS(
    phoneNumber: string,
    message: string,
  ): Promise<{ sent: boolean; error?: string }> {
    try {
      // Try native SMS API if available
      if (Platform.OS === 'android') {
        return this.sendSMSAndroid(phoneNumber, message);
      } else if (Platform.OS === 'ios') {
        return this.sendSMSiOS(phoneNumber, message);
      }

      throw new Error('Unsupported platform');
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        sent: false,
        error: String(error),
      };
    }
  }

  /**
   * Android SMS implementation using Linking
   * Note: This opens SMS app - for direct send, you'd need a native module
   */
  private static async sendSMSAndroid(
    phoneNumber: string,
    message: string,
  ): Promise<{ sent: boolean; error?: string }> {
    try {
      // URL encode the message
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('SMS not available');
      }

      // This opens the SMS app - user must send manually
      // For true background SMS, you need a native module with SMS permissions
      await Linking.openURL(smsUrl);

      return { sent: true };
    } catch (error) {
      return {
        sent: false,
        error: String(error),
      };
    }
  }

  /**
   * iOS SMS implementation using Linking
   */
  private static async sendSMSiOS(
    phoneNumber: string,
    message: string,
  ): Promise<{ sent: boolean; error?: string }> {
    try {
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${phoneNumber}?body=${encodedMessage}`;

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (!canOpen) {
        throw new Error('SMS not available');
      }

      await Linking.openURL(smsUrl);

      return { sent: true };
    } catch (error) {
      return {
        sent: false,
        error: String(error),
      };
    }
  }

  /**
   * Generate emergency call summary with location
   */
  static generateCallSummary(
    profile: EmergencyProfile,
    location: LocationSnapshot | null,
  ): string {
    const lines: string[] = [];

    lines.push(`=== EMERGENCY CALL SUMMARY ===`);
    lines.push(`User: ${profile.fullName}`);
    // Age is optional in profile model
    // lines.push(`Age: ${profile.age || 'Not specified'}`);
    lines.push(`\nCommunication:`);
    lines.push(`- Can speak: ${profile.canSpeak ? 'Yes' : 'No'}`);
    const allergies = profile.medicalInfo?.allergies;
    if (allergies && allergies.length) {
      lines.push(`\nAllergies: ${allergies.join(', ')}`);
    }

    const conditions = profile.medicalInfo?.conditions;
    if (conditions && conditions.length) {
      lines.push(`Medical Conditions: ${conditions.join(', ')}`);
    }

    if (profile.medicalInfo?.bloodType) {
      lines.push(`Blood Type: ${profile.medicalInfo.bloodType}`);
    }

    if (location) {
      lines.push(`\nLocation:`);
      if (location.address) {
        lines.push(`Address: ${location.address}`);
      }
      lines.push(`Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      lines.push(`Accuracy: ${location.accuracy?.toFixed(0)}m`);
      lines.push(`Map Link: https://maps.google.com/?q=${location.latitude},${location.longitude}`);
    } else {
      lines.push(`\nLocation: Not available`);
    }

    if (profile.emergencyContacts?.length) {
      lines.push(`\nEmergency Contacts:`);
      profile.emergencyContacts.forEach((contact, idx) => {
        lines.push(`${idx + 1}. ${contact.name} (${contact.relationship}): ${contact.phone}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Format phone number to international format if needed
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = 'IN'): string {
    // Remove non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Handle India +91
    if (countryCode === 'IN') {
      if (digitsOnly.length === 10) {
        return `+91${digitsOnly}`;
      }
      if (digitsOnly.startsWith('91')) {
        return `+${digitsOnly}`;
      }
    }

    return digitsOnly.length > 0 ? `+${digitsOnly}` : phoneNumber;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    // Accept 10-15 digit international numbers
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }

  /**
   * Generate shareable emergency link for verification
   * This creates a unique verification code for the emergency
   */
  static generateEmergencyVerification(userId: string, timestamp: number): string {
    const code = `${userId}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '');
    return code.substring(0, 16); // 16 char code
  }
}
