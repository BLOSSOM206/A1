/**
 * SOS Button Component
 * Large, accessible emergency button for triggering SOS sequence
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';

export interface SOSButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isCountingDown?: boolean;
  remainingSeconds?: number;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  testID?: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onPress,
  disabled = false,
  isCountingDown = false,
  remainingSeconds = 0,
  size = 'large',
  label = 'SOS',
  testID = 'sos-button',
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  // Pulse animation when counting down
  React.useEffect(() => {
    if (isCountingDown) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isCountingDown, pulseAnim]);

  // Press animation
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, fontSize: 20 };
      case 'medium':
        return { width: 100, height: 100, fontSize: 24 };
      case 'large':
        return { width: 140, height: 140, fontSize: 32 };
    }
  };

  const { width, height, fontSize } = getSize();

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      {/* Pulse background (visible when counting) */}
      {isCountingDown && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: width * 1.5,
              height: height * 1.5,
              borderRadius: (width * 1.5) / 2,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      )}

      {/* Main button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            width,
            height,
            borderRadius: width / 2,
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={isCountingDown ? `SOS countdown ${remainingSeconds} seconds` : 'SOS Emergency Button'}
          accessibilityHint={isCountingDown ? 'Double tap to cancel the emergency countdown' : 'Double tap to start the emergency SOS countdown'}
          accessibilityState={{ disabled }}
        >
          <View
            style={[
              styles.buttonContent,
              {
                backgroundColor: isCountingDown ? '#D32F2F' : '#C62828',
                width: '100%',
                height: '100%',
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  fontSize,
                  color: '#FFFFFF',
                },
              ]}
            >
              {label}
            </Text>

            {/* Countdown display */}
            {isCountingDown && remainingSeconds > 0 && (
              <Text
                style={[
                  styles.countdownText,
                  {
                    fontSize: fontSize / 1.5,
                  },
                ]}
              >
                {remainingSeconds}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>

      {/* Accessibility subtitle */}
      {isCountingDown && (
        <Text style={styles.countdownLabel}>
          Tap to cancel
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: 'rgba(198, 40, 40, 0.3)',
    borderColor: '#C62828',
    borderWidth: 2,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#C62828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 8,
  },
  countdownLabel: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});
