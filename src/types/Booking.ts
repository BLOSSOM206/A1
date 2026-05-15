import { Restaurant } from "./Restaurant";

export type BookingStatus = 'Confirmed' | 'Pending' | 'Arrived' | 'Completed' | 'Cancelled';

export type Booking = {
  id?: string;
  restaurant: Restaurant;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  wheelchairSeating: boolean;
  sensoryFriendly: boolean;
  assistanceRequests: string;
  communicationPreference: string;
  status?: BookingStatus;
  createdAt?: string;
};
