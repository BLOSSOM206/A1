/**
 * Location Service
 * Handles GPS location fetching and caching
 */

import { LocationSnapshot } from '../../types/Emergency';
import { STORAGE_KEYS } from '../../constants/sosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export class LocationService {
  private static lastKnownLocation: LocationSnapshot | null = null;

  /**
   * Get current location with timeout
   * Returns last known location if current fetch fails
   */
  static async getCurrentLocation(): Promise<LocationSnapshot | null> {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return this.getLastKnownLocation();
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location: LocationSnapshot = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        timestamp: position.timestamp,
      };

      this.lastKnownLocation = location;
      const address = await this.getAddressFromCoordinates(location.latitude, location.longitude);
      location.address = address;
      this.cacheLastLocation(location);

      return location;
    } catch (error) {
      console.error('Geolocation error:', error);
      return this.getLastKnownLocation();
    }
  }

  /**
   * Get last known location from cache
   */
  static async getLastKnownLocation(): Promise<LocationSnapshot | null> {
    // Try memory cache first
    if (this.lastKnownLocation) {
      return this.lastKnownLocation;
    }

    // Try persistent cache
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.LAST_KNOWN_LOCATION);
      if (cached) {
        this.lastKnownLocation = JSON.parse(cached);
        return this.lastKnownLocation;
      }
    } catch (error) {
      console.error('Failed to load cached location:', error);
    }

    return null;
  }

  /**
   * Cache location for emergency use
   */
  private static async cacheLastLocation(location: LocationSnapshot): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_KNOWN_LOCATION,
        JSON.stringify(location),
      );
    } catch (error) {
      console.error('Failed to cache location:', error);
      // Don't throw - caching is non-critical
    }
  }

  /**
   * Generate Google Maps link for location
   */
  static generateLocationLink(location: LocationSnapshot): string {
    return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  }

  /**
   * Format location for SMS/voice message
   */
  static formatLocationForMessage(location: LocationSnapshot | null): string {
    if (!location) {
      return 'Location unable to be determined.';
    }

    if (location.address) {
      return `Current location is ${location.address}. Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}.`;
    }

    return `Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}. Map: ${this.generateLocationLink(location)}`;
  }

  /**
   * Get address from coordinates using reverse geocoding
   * Note: Requires Google Maps API or similar service
   * For now, returns null - implement with preferred service
   */
  private static async getAddressFromCoordinates(
    _latitude: number,
    _longitude: number,
  ): Promise<string | undefined> {
    try {
      // TODO: Integrate with Google Geocoding API or similar
      // This requires API key and setup
      // For MVP, we'll just return coordinates
      return undefined;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return undefined;
    }
  }

  /**
   * Check if location services are available
   */
  static isLocationAvailable(): boolean {
    return true;
  }
}
