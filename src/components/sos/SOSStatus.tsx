/**
 * SOS Status Component
 * Displays current step in SOS sequence and user information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { EmergencyProfile, LocationSnapshot } from '../../types/Emergency';

export interface SOSStatusProps {
  isActive: boolean;
  status: 'idle' | 'counting' | 'calling' | 'completed' | 'cancelled' | 'error';
  profile: EmergencyProfile | null;
  location: LocationSnapshot | null;
  error?: string | null;
  onCancel?: () => void;
  containerStyle?: ViewStyle;
}

export const SOSStatus: React.FC<SOSStatusProps> = ({
  isActive,
  status,
  profile,
  location,
  error,
  onCancel,
  containerStyle,
}) => {
  const allergies = profile?.medicalInfo?.allergies || profile?.allergies || [];
  const conditions = profile?.medicalInfo?.conditions || profile?.medicalConditions || [];
  const emergencyContacts = profile?.emergencyContacts || [];

  const getStatusInfo = () => {
    switch (status) {
      case 'counting':
        return {
          title: 'SOS Countdown',
          description: 'Emergency alert will be triggered...',
          icon: '!',
          color: '#FF6F00',
        };
      case 'calling':
        return {
          title: 'Calling Emergency Services',
          description: 'Dialer opened. Sending messages...',
          icon: 'CALL',
          color: '#F44336',
        };
      case 'completed':
        return {
          title: 'Emergency Alert Sent',
          description: 'All contacts notified',
          icon: 'OK',
          color: '#4CAF50',
        };
      case 'cancelled':
        return {
          title: 'Alert Cancelled',
          description: 'No emergency services contacted',
          icon: 'X',
          color: '#9E9E9E',
        };
      case 'error':
        return {
          title: 'Alert Failed',
          description: 'Please retry or call manually',
          icon: '!',
          color: '#E53935',
        };
      default:
        return {
          title: 'Ready',
          description: 'Press SOS button to activate',
          icon: 'SOS',
          color: '#999',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const showDetails = isActive && profile;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusInfo.color + '15',
        },
        containerStyle,
      ]}
    >
      {/* Status Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>
        {status === 'calling' && (
          <ActivityIndicator size="small" color={statusInfo.color} />
        )}
      </View>

      {/* Error Message */}
      {error && status === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* User Details (if active) */}
      {showDetails && (
        <ScrollView
          style={styles.detailsContainer}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User Name</Text>
            <Text style={styles.detailValue}>{profile.fullName}</Text>
          </View>

          {/* Communication Status */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Can Speak</Text>
            <Text style={styles.detailValue}>
              {profile.canSpeak ? 'Yes' : 'No (deaf or mute)'}
            </Text>
          </View>

          {/* Medical Info */}
          {(allergies.length || conditions.length) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medical Alert</Text>
              <View style={styles.medicalContainer}>
                {allergies.map((allergy, idx) => (
                  <Text key={`allergy-${idx}`} style={styles.medicalTag}>
                    {allergy}
                  </Text>
                ))}
                {conditions.map((condition, idx) => (
                  <Text key={`condition-${idx}`} style={styles.medicalTag}>
                    {condition}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          {location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {location.address || 'Detecting...'}
              </Text>
              <Text style={styles.coordinatesText}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Emergency Contacts */}
          {emergencyContacts.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Emergency Contacts ({emergencyContacts.length})
              </Text>
              {emergencyContacts.slice(0, 3).map((contact, idx) => (
                <Text key={`contact-${idx}`} style={styles.contactTag}>
                  {idx + 1}. {contact.name} ({contact.relationship})
                </Text>
              ))}
              {emergencyContacts.length > 3 && (
                <Text style={styles.moreContacts}>
                  +{emergencyContacts.length - 3} more
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cancel Button (if appropriate) */}
      {isActive && status !== 'completed' && status !== 'cancelled' && onCancel && (
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel SOS alert"
        >
          <Text style={styles.cancelButtonText}>Cancel SOS</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '500',
  },

  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Courier New',
  },

  medicalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medicalTag: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  contactTag: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  moreContacts: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },

  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
