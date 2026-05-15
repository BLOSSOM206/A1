import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from '../types/Booking';

const STORAGE_KEY = '@my_bookings_v1';

export async function getBookings(): Promise<Booking[]> {
  try {
    console.log('[bookingsStore] getBookings: reading', STORAGE_KEY);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Booking[];
    console.log('[bookingsStore] getBookings: found', parsed.length);
    return parsed;
  } catch (e) {
    console.warn('getBookings failed', e);
    return [];
  }
}

export async function saveBookings(bookings: Booking[]) {
  try {
    console.log('[bookingsStore] saveBookings: writing', bookings.length);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    console.log('[bookingsStore] saveBookings: ok');
  } catch (e) {
    console.warn('saveBookings failed', e);
  }
}

export async function addBooking(b: Booking) {
  console.log('[bookingsStore] addBooking: incoming', b);
  const bookings = await getBookings();
  const booking = { ...b, id: b.id ?? `${Date.now()}`, createdAt: b.createdAt ?? new Date().toISOString(), status: b.status ?? 'Confirmed' };
  bookings.push(booking);
  await saveBookings(bookings);
  console.log('[bookingsStore] addBooking: saved id=', booking.id);
  return booking;
}

export async function updateBookingStatus(id: string, status: Booking['status']) {
  const bookings = await getBookings();
  const idx = bookings.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], status };
  await saveBookings(bookings);
  return bookings[idx];
}

export async function saveBooking(b: Booking) {
  return addBooking(b);
}

export async function clearBookings() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[bookingsStore] clearBookings: removed');
  } catch (e) {
    console.warn('clearBookings failed', e);
  }
}
