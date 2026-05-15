import React, { useMemo, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { Booking } from '../types/Booking';
import { AppTheme, useTheme } from '../theme';

type Props = {
  booking: Booking;
  onArrive?: (id: string) => Promise<void> | void;
};

export const BookingCard: React.FC<Props> = ({ booking, onArrive }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [disabled, setDisabled] = useState(booking.status === 'Arrived' || booking.status === 'Completed' || booking.status === 'Cancelled');

  const handleArrive = async () => {
    if (disabled) return;
    setDisabled(true);
    try {
      await onArrive?.(booking.id ?? '');
      const msg = 'Restaurant notified — status set to Arrived.';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert('Arrived', msg);
    } catch (e) {
      setDisabled(false);
      Alert.alert('Error', 'Could not confirm arrival.');
    }
  };

  return (
    <View style={styles.card} accessible accessibilityLabel={`Booking for ${booking.restaurantName} on ${booking.date} at ${booking.time}`}>
      <View style={styles.row}>
        {booking.restaurant?.images?.[0] ? (
          <Image source={{ uri: booking.restaurant.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{booking.restaurantName}</Text>
          <Text style={styles.meta}>{booking.date} • {booking.time}</Text>
          <Text style={styles.meta}>Guests: {booking.guests}</Text>
          <Text style={styles.meta}>{booking.wheelchairSeating ? 'Wheelchair seating requested' : ''}{booking.sensoryFriendly ? ` • Sensory-friendly` : ''}</Text>
          <Text style={styles.status}>Status: {booking.status ?? 'Confirmed'}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.arriveButton, disabled ? styles.arriveButtonDisabled : null]}
        onPress={handleArrive}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={disabled ? 'Arrival confirmed' : 'I am here - notify restaurant'}
        disabled={disabled}
      >
        <Text style={styles.arriveText}>{disabled ? 'Arrived' : 'I Am Here'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 72, height: 72, borderRadius: 8, marginRight: 12, backgroundColor: theme.colors.inputBackground },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  meta: { fontSize: 13, color: theme.colors.textSubtle, marginTop: 4 },
  status: { marginTop: 8, fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  arriveButton: {
    marginTop: 10,
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  arriveButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  arriveText: { color: theme.colors.accentText, fontWeight: '800' },
});

export default BookingCard;
