/**
 * Countdown Display Component
 * Shows visual countdown with progress bar
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';

export interface CountdownDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  variant?: 'minimal' | 'detailed' | 'compact';
  containerStyle?: ViewStyle;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  remainingSeconds,
  totalSeconds,
  variant = 'detailed',
  containerStyle,
}) => {
  const progress = 1 - remainingSeconds / totalSeconds;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Color intensity based on remaining time
  const getColor = () => {
    if (remainingSeconds > 3) return '#4CAF50'; // Green
    if (remainingSeconds > 1) return '#FFC107'; // Amber
    return '#F44336'; // Red
  };

  if (variant === 'minimal') {
    return (
      <View style={[styles.minimalContainer, containerStyle]} accessible accessibilityRole="timer" accessibilityLabel={`${remainingSeconds} seconds remaining`}>
        <Text style={styles.minimalText}>{remainingSeconds}s</Text>
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, containerStyle]} accessible accessibilityRole="timer" accessibilityLabel={`${remainingSeconds} seconds remaining in SOS countdown`}>
        <View style={styles.compactProgress}>
          <Animated.View
            style={[
              styles.compactProgressBar,
              {
                width: progressWidth,
                backgroundColor: getColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.compactText}>{remainingSeconds}s remaining</Text>
      </View>
    );
  }

  // Detailed variant (default)
  return (
    <View style={[styles.detailedContainer, containerStyle]} accessible accessibilityRole="timer" accessibilityLabel={`${remainingSeconds} seconds remaining in SOS countdown`}>
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{remainingSeconds}</Text>
        <Text style={styles.timerLabel}>seconds</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: getColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round((remainingSeconds / totalSeconds) * 100)}%
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: getColor() }]} />
        <Text style={styles.statusText}>
          {remainingSeconds > 3
            ? 'Still time to cancel'
            : remainingSeconds > 0
            ? 'Emergency alert sending...'
            : 'Initiating emergency call'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Minimal style
  minimalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F44336',
  },

  // Compact style
  compactContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactProgress: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  compactProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  compactText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Detailed style
  detailedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
    borderColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F44336',
  },
  timerLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
