import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Restaurant } from "../types/Restaurant";
import { Booking } from "../types/Booking";
import { AppTheme, useTheme } from "../theme";
import { useAccessibility } from "../context/AccessibilityContext";
import { useScreenNarration } from "../hooks/useScreenNarration";

type BookingScreenProps = {
  restaurant: Restaurant;
  onBack?: () => void;
  onConfirmBooking: (booking: Booking) => void;
};

export const BookingScreen: React.FC<BookingScreenProps> = ({
  restaurant,
  onBack,
  onConfirmBooking,
}) => {
  const { theme } = useTheme();
  const { speak } = useAccessibility();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateText, setDateText] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guests, setGuests] = useState("2");
  const [notes, setNotes] = useState("");
  const [assistanceRequests, setAssistanceRequests] = useState("");
  const [wheelchairSeating, setWheelchairSeating] = useState(false);
  const [sensoryFriendly, setSensoryFriendly] = useState(false);
  const [communicationPreference, setCommunicationPreference] = useState("Spoken conversation");

  const timeSlots = [
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
  ];

  const handleOpenDatePicker = () => {
    setShowDatePicker((current) => !current);
  };

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const quickDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });

  useScreenNarration({
    title: "Booking",
    description: [
      `You are booking a table at ${restaurant.name}.`,
      `Selected date is ${dateText.trim() || formattedDate}.`,
      selectedTime ? `Selected time is ${selectedTime}.` : "Choose a time slot.",
      `Guest count is ${guests || "not set"}.`,
      wheelchairSeating ? "Wheelchair seating is requested." : "",
      sensoryFriendly ? "Sensory friendly seating is requested." : "",
      `Communication preference is ${communicationPreference}.`,
      "Confirm Booking completes the reservation.",
    ],
  });

  const handleConfirm = () => {
    const finalDate = dateText.trim() || formattedDate;

    if (!finalDate || !selectedTime) {
      Alert.alert("Missing details", "Please select or enter a date and time.");
      return;
    }

    const guestCount = Number.parseInt(guests, 10);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      Alert.alert("Invalid guests", "Enter at least one guest.");
      return;
    }

    const booking: Booking = {
      restaurant,
      restaurantName: restaurant.name,
      date: finalDate,
      time: selectedTime,
      guests: guestCount,
      notes: notes.trim(),
      wheelchairSeating,
      sensoryFriendly,
      assistanceRequests: assistanceRequests.trim(),
      communicationPreference,
    };

    speak(`Reservation confirmation. Booking ${restaurant.name} for ${guestCount} guests on ${finalDate} at ${selectedTime}.`, {
      force: true,
      key: "booking-confirmation",
    }).catch(() => undefined);
    onConfirmBooking(booking);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {onBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to restaurant details"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.title} accessibilityRole="header">
        Book Table
      </Text>
      <Text style={styles.subtitle}>{restaurant.name}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Restaurant</Text>
        <Text style={styles.value}>{restaurant.name}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={handleOpenDatePicker}
          accessibilityRole="button"
          accessibilityLabel="Select Date"
          accessibilityHint="Show or hide quick date choices"
        >
          <Text style={styles.selectorText}>{showDatePicker ? "Hide Quick Dates" : "Show Quick Dates"}</Text>
        </TouchableOpacity>
        <Text style={styles.selectedValueText}>{formattedDate}</Text>

        {showDatePicker ? (
          <View style={styles.quickDateRow}>
            {quickDates.map((date) => {
              const label = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
              const dateValue = date.toLocaleDateString();
              return (
                <TouchableOpacity
                  key={dateValue}
                  style={styles.quickDateChip}
                  onPress={() => {
                    setSelectedDate(date);
                    setDateText("");
                    setShowDatePicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${label}`}
                  accessibilityHint="Use this date for the reservation"
                >
                  <Text style={styles.quickDateText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TextInput
          value={dateText}
          onChangeText={setDateText}
          placeholder="Or enter date manually, e.g. 2026-05-12"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.input, styles.manualDateInput]}
          accessibilityLabel="Manual date input"
          accessibilityHint="Enter a date manually if the quick dates are not suitable"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select Time Slot</Text>
        <View style={styles.timeSlotsWrap}>
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.timeSlotChip, isSelected ? styles.timeSlotChipSelected : null]}
                onPress={() => setSelectedTime(slot)}
                accessibilityRole="button"
                accessibilityLabel={`Select time ${slot}`}
                accessibilityHint="Use this time slot for the reservation"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.timeSlotText, isSelected ? styles.timeSlotTextSelected : null]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Number of Guests</Text>
        <TextInput
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
          style={styles.input}
          accessibilityLabel="Number of guests input"
          accessibilityHint="Enter how many guests will attend"
          placeholder="2"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Accessibility Needs</Text>
        <TouchableOpacity
          style={[styles.toggleButton, wheelchairSeating ? styles.toggleSelected : null]}
          onPress={() => setWheelchairSeating((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: wheelchairSeating }}
          accessibilityLabel="Request wheelchair seating"
          accessibilityHint="Tell the restaurant to prepare wheelchair accessible seating"
        >
          <Text style={[styles.toggleText, wheelchairSeating ? styles.toggleTextSelected : null]}>Wheelchair seating</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, sensoryFriendly ? styles.toggleSelected : null]}
          onPress={() => setSensoryFriendly((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: sensoryFriendly }}
          accessibilityLabel="Request sensory friendly seating"
          accessibilityHint="Tell the restaurant to prepare a calmer seating option"
        >
          <Text style={[styles.toggleText, sensoryFriendly ? styles.toggleTextSelected : null]}>Sensory-friendly seating</Text>
        </TouchableOpacity>

        <TextInput
          value={assistanceRequests}
          onChangeText={setAssistanceRequests}
          multiline
          style={[styles.input, styles.notesInput]}
          accessibilityLabel="Special assistance requests"
          accessibilityHint="Describe support you need before arrival"
          placeholder="Tell staff what support you need before arrival"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Communication Preference</Text>
        {["Spoken conversation", "Text message", "Written notes", "Sign language support"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.preferenceButton, communicationPreference === option ? styles.preferenceSelected : null]}
            onPress={() => setCommunicationPreference(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: communicationPreference === option }}
            accessibilityLabel={option}
            accessibilityHint="Choose how staff should communicate with you"
          >
            <Text style={[styles.preferenceText, communicationPreference === option ? styles.preferenceTextSelected : null]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, styles.notesInput]}
          accessibilityLabel="Booking notes input"
          accessibilityHint="Add any extra requests for restaurant staff"
          placeholder="Add any special requests"
          placeholderTextColor={theme.colors.textSubtle}
        />
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
        accessibilityRole="button"
        accessibilityLabel="Confirm booking"
        accessibilityHint="Save this reservation and open the confirmation screen"
      >
        <Text style={styles.confirmButtonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  backButtonText: {
    color: theme.colors.secondaryText,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSubtle,
    marginBottom: 8,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "700",
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.inputBackground,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedValueText: {
    marginTop: 10,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  timeSlotsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  timeSlotChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  timeSlotChipSelected: {
    backgroundColor: theme.colors.chipBackground,
    borderColor: theme.colors.accent,
  },
  timeSlotText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  timeSlotTextSelected: {
    color: theme.colors.accent,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.text,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  manualDateInput: {
    marginTop: 10,
  },
  quickDateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  quickDateChip: {
    borderWidth: 1,
    borderColor: theme.colors.chipBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.chipBackground,
  },
  quickDateText: {
    color: theme.colors.chipText,
    fontSize: 13,
    fontWeight: "600",
  },
  toggleButton: {
    minHeight: 46,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  toggleSelected: {
    backgroundColor: theme.colors.chipBackground,
    borderColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  toggleTextSelected: {
    color: theme.colors.primary,
  },
  preferenceButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  preferenceSelected: {
    backgroundColor: theme.colors.chipBackground,
    borderColor: theme.colors.accent,
  },
  preferenceText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  preferenceTextSelected: {
    color: theme.colors.accent,
  },
  confirmButton: {
    marginTop: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    color: theme.colors.accentText,
    fontSize: 16,
    fontWeight: "800",
  },
});
