import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text } from 'react-native';
import { Booking } from '../types/Booking';
import { AppTheme, useTheme } from '../theme';
import { getBookings, updateBookingStatus } from '../services/bookingsStore';
import BookingCard from '../components/BookingCard';
import { useScreenNarration } from '../hooks/useScreenNarration';

export const MyBookingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const bookingSummary = useMemo(() => {
    if (bookings === null) {
      return 'Bookings are loading.';
    }

    if (bookings.length === 0) {
      return 'No bookings yet. Make a reservation from Restaurants to see it here.';
    }

    const summaries = bookings
      .slice(0, 3)
      .map((booking) => `${booking.restaurantName} on ${booking.date} at ${booking.time}, for ${booking.guests} guests`);
    return `${bookings.length} upcoming reservation${bookings.length === 1 ? '' : 's'}. ${summaries.join('. ')}. The I Am Here button notifies the restaurant that you have arrived.`;
  }, [bookings]);

  useScreenNarration({
    title: 'My Bookings',
    description: bookingSummary,
    enabled: bookings !== null,
  });

  const load = useCallback(async () => {
    console.log('[MyBookingsScreen] load bookings');
    const all = await getBookings();
    console.log('[MyBookingsScreen] loaded', all.length);
    setBookings(all.sort((a, b) => (a.date > b.date ? 1 : -1)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleArrive = async (id: string) => {
    if (!id) return;
    const updated = await updateBookingStatus(id, 'Arrived');
    if (!updated) {
      Alert.alert('Error', 'Could not update booking');
      return;
    }
    await load();
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <BookingCard booking={item} onArrive={handleArrive} />
  );

  if (bookings === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading bookings…</Text>
      </SafeAreaView>
    );
  }

  if (bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyTitle}>No bookings yet</Text>
        <Text style={styles.emptyText}>Make a reservation from Restaurants to see it here.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id ?? `${b.createdAt ?? b.date}-${b.time}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  loading: { color: theme.colors.textMuted, fontSize: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 32 },
  emptyText: { color: theme.colors.textSubtle, marginTop: 8 },
  list: { paddingBottom: 24 },
});

export default MyBookingsScreen;
