import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Booking } from "../types/Booking";
import { AppTheme, useTheme } from "../theme";

type SuccessScreenProps = {
  booking: Booking;
  onDone: () => void;
};

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ booking, onDone }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Table booked successfully!
        </Text>
        <Text style={styles.restaurantName}>{booking.restaurantName}</Text>
        <Text style={styles.detailText}>{`${booking.date} at ${booking.time}`}</Text>
        <Text style={styles.detailText}>{`${booking.guests} guest${booking.guests > 1 ? "s" : ""}`}</Text>
        <Text style={styles.detailText}>{`Communication: ${booking.communicationPreference}`}</Text>
        {booking.wheelchairSeating ? <Text style={styles.detailText}>Wheelchair seating requested</Text> : null}
        {booking.sensoryFriendly ? <Text style={styles.detailText}>Sensory-friendly seating requested</Text> : null}
        {booking.assistanceRequests ? <Text style={styles.notes}>{booking.assistanceRequests}</Text> : null}
        {booking.notes ? <Text style={styles.notes}>{booking.notes}</Text> : null}
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneButtonText}>Done</Text>
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
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: theme.isHighContrast ? 2 : 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
  },
  restaurantName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  detailText: {
    marginTop: 8,
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  notes: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: "italic",
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneButtonText: {
    color: theme.colors.accentText,
    fontSize: 16,
    fontWeight: "800",
  },
});
