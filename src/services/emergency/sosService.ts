/**
 * SOS Orchestration Service
 * Main coordinator that ties together location, TTS, and emergency dial
 */

import { SOSEvent, EmergencyProfile, LocationSnapshot } from '../../types/Emergency';
import { LocationService } from './locationService';
import { EmergencyDialService } from './emergencyDialService';
import { DEFAULT_EMERGENCY_NUMBER } from '../../constants/sosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SOSService {
  /**
   * Execute full SOS sequence
   * Returns event log and handles all steps
   */
  static async triggerSOS(
    profile: EmergencyProfile,
    emergencyNumber: string = DEFAULT_EMERGENCY_NUMBER,
  ): Promise<SOSEvent> {
    const sosEvent: SOSEvent = {
      id: `sos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'initiated',
      location: null,
      profile,
      emergencyNumber,
      contactsSMS: [],
      ttsMessageGenerated: false,
      errors: [],
    };

    try {
      // Step 1: Get current location (with fallback)
      sosEvent.status = 'initiated';
      let location: LocationSnapshot | null = null;

      try {
        location = await LocationService.getCurrentLocation();
        sosEvent.location = location;
      } catch (error) {
        sosEvent.errors.push(`Location error: ${String(error)}`);
        // Continue without location
      }

      // Step 2: Create a concise summary message and log the event
      try {
        // generateCallSummary is used at send time; no transient field stored on event
        EmergencyDialService.generateCallSummary(profile, location);
      } catch (error) {
        sosEvent.errors.push(`Summary generation error: ${String(error)}`);
      }

      // Step 3: Log the event before performing actions
      await this.logSOSEvent(sosEvent);

      // Step 4: Trigger dialing and SMS (do not rely on TTS in MVP)
      sosEvent.status = 'dialing';

      // Open dialer first (user confirms call)
      try {
        await this.openDialer(emergencyNumber, sosEvent);
      } catch {
        // already recorded by openDialer
      }

      // Send SMS to contacts sequentially
      await this.sendEmergencySMSToContacts(profile, location, emergencyNumber, sosEvent);

      sosEvent.status = 'completed';
    } catch (error) {
      sosEvent.status = 'failed';
      sosEvent.errors.push(`SOS execution error: ${String(error)}`);
      console.error('Critical SOS error:', error);
    }

    // Final log update
    await this.logSOSEvent(sosEvent);

    return sosEvent;
  }

  /**
   * Open emergency dialer and handle result
   */
  private static async openDialer(
    emergencyNumber: string,
    sosEvent: SOSEvent,
  ): Promise<void> {
    try {
      await EmergencyDialService.openEmergencyDialer(emergencyNumber);
      sosEvent.status = 'called';
    } catch (error) {
      sosEvent.errors.push(`Dialer error: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Play generated emergency audio message
   */
  // audio playback removed in MVP - TTS not used

  /**
   * Send emergency SMS to all contacts
   */
  private static async sendEmergencySMSToContacts(
    profile: EmergencyProfile,
    location: LocationSnapshot | null,
    emergencyNumber: string,
    sosEvent: SOSEvent,
  ): Promise<void> {
    if (!profile.emergencyContacts?.length) {
      return;
    }

    try {
      // Build a concise SMS using the call summary
      const message = EmergencyDialService.generateCallSummary(profile, location);

      for (const contact of profile.emergencyContacts) {
        try {
          const result = await EmergencyDialService.sendEmergencySMS(
            contact.phone,
            message,
          );

          if (result.sent) {
            sosEvent.contactsSMS.push(contact.phone);
            sosEvent.status = 'sms_sent';
          } else {
            sosEvent.errors.push(`SMS failed to ${contact.phone}: ${result.error}`);
          }
        } catch (err) {
          sosEvent.errors.push(`SMS error for ${contact.phone}: ${String(err)}`);
        }
      }
    } catch (error) {
      sosEvent.errors.push(`SMS batch error: ${String(error)}`);
    }
  }

  /**
   * Retrieve SOS event history
   */
  static async getSOSHistory(limit: number = 20): Promise<SOSEvent[]> {
    try {
      const history = await AsyncStorage.getItem('sos_event_history');
      if (!history) return [];

      const events: SOSEvent[] = JSON.parse(history);
      return events.slice(-limit).reverse();
    } catch (error) {
      console.error('Failed to get SOS history:', error);
      return [];
    }
  }

  /**
   * Log individual SOS event
   */
  private static async logSOSEvent(event: SOSEvent): Promise<void> {
    try {
      let history: SOSEvent[] = [];

      try {
        const stored = await AsyncStorage.getItem('sos_event_history');
        if (stored) {
          history = JSON.parse(stored);
        }
      } catch {
        history = [];
      }

      // Add new event and keep last 50
      history.push(event);
      history = history.slice(-50);

      await AsyncStorage.setItem('sos_event_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to log SOS event:', error);
      // Don't throw - logging is non-critical
    }
  }

  /**
   * Get last SOS event
   */
  static async getLastSOSEvent(): Promise<SOSEvent | null> {
    try {
      const history = await AsyncStorage.getItem('sos_event_history');
      if (!history) return null;

      const events: SOSEvent[] = JSON.parse(history);
      return events.length > 0 ? events[events.length - 1] : null;
    } catch (error) {
      console.error('Failed to get last SOS event:', error);
      return null;
    }
  }

  /**
   * Clear SOS event history (use with caution)
   */
  static async clearSOSHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('sos_event_history');
    } catch (error) {
      console.error('Failed to clear SOS history:', error);
      throw error;
    }
  }

  /**
   * Generate summary report from SOS event
   */
  static generateSOSReport(event: SOSEvent): string {
    const lines: string[] = [];

    lines.push(`\n=== SOS EMERGENCY REPORT ===\n`);
    lines.push(`Event ID: ${event.id}`);
    lines.push(`Time: ${new Date(event.timestamp).toLocaleString()}`);
    lines.push(`Status: ${event.status}`);
    lines.push(`Emergency Number: ${event.emergencyNumber}`);

    lines.push(`\n--- User Information ---`);
    lines.push(`Name: ${event.profile.fullName}`);
    lines.push(`Can Speak: ${event.profile.canSpeak ? 'No' : 'Yes'}`);

    const allergies = event.profile.medicalInfo?.allergies;
    if (allergies && allergies.length) {
      lines.push(`Allergies: ${allergies.join(', ')}`);
    }

    const conditions = event.profile.medicalInfo?.conditions;
    if (conditions && conditions.length) {
      lines.push(`Conditions: ${conditions.join(', ')}`);
    }

    if (event.location) {
      lines.push(`\n--- Location ---`);
      if (event.location.address) {
        lines.push(`Address: ${event.location.address}`);
      }
      lines.push(
        `Coordinates: ${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`,
      );
      lines.push(`Accuracy: +/-${event.location.accuracy?.toFixed(0)}m`);
    }

    if (event.contactsSMS.length > 0) {
      lines.push(`\n--- SMS Notifications Sent ---`);
      event.contactsSMS.forEach((num) => {
        lines.push(`- ${num}`);
      });
    }

    if (event.errors.length > 0) {
      lines.push(`\n--- Errors/Issues ---`);
      event.errors.forEach((err) => {
        lines.push(`- ${err}`);
      });
    }

    lines.push(`\n--- Actions Taken ---`);
    lines.push(`OK Emergency dialer opened with ${event.emergencyNumber}`);
    lines.push(`${event.ttsMessageGenerated ? 'OK' : 'NO'} Emergency message generated`);
    lines.push(`${event.contactsSMS.length > 0 ? 'OK' : 'NO'} SMS alerts sent`);

    return lines.join('\n');
  }
}
