import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Linking, Pressable } from "react-native";
import { Restaurant, AccessibilityFeature } from "../../types/Restaurant";
import { AppTheme, useTheme } from "../../theme";

interface RestaurantCardProps {
    restaurant: Restaurant;
    onPress?: () => void;
}

const FALLBACK_IMAGE_URLS = [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=60",
];

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const safeName = restaurant.name || "Unnamed restaurant";
    const safeAddress = restaurant.location?.address || "Address unavailable";
    const safeDescription = restaurant.description || "No description available";
    const safeFeatures = restaurant.features || [];
    const safeImage = restaurant.image || "";
    const [imageIndex, setImageIndex] = useState(0);

    const imageCandidates = useMemo(() => {
        const candidates = [safeImage, ...FALLBACK_IMAGE_URLS].filter(Boolean);
        return candidates.filter((value, index) => candidates.indexOf(value) === index);
    }, [safeImage]);

    const activeImage = imageCandidates[imageIndex] || "";

    useEffect(() => {
        setImageIndex(0);
    }, [restaurant.id, safeImage]);

    const openMaps = useCallback(async (name: string, lat: number, lon: number) => {
        const query = encodeURIComponent(`${name} ${lat},${lon}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.log("[RestaurantCard] Google Maps open failed:", error);
        }
    }, []);

    const handleDirections = useCallback(async () => {
        const lat = restaurant.location?.latitude;
        const lon = restaurant.location?.longitude;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            Alert.alert("Directions unavailable", "Valid location coordinates are not available for this restaurant.");
            return;
        }

        await openMaps(safeName, lat, lon);
    }, [openMaps, restaurant.location?.latitude, restaurant.location?.longitude, safeName]);

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={onPress ? `Open details for ${safeName}` : `${safeName} restaurant card`}
            accessibilityHint={onPress ? "Double tap to open the restaurant details" : undefined}
        >

            {/* IMAGE */}
            {activeImage ? (
                <Image
                    source={{ uri: activeImage }}
                    style={styles.image}
                    resizeMode="cover"
                    accessibilityRole="image"
                    accessibilityLabel={`${safeName} preview image`}
                    onError={(error) => {
                        console.log("[RestaurantCard] Image load failed:", {
                            id: restaurant.id,
                            image: activeImage,
                            error: error.nativeEvent,
                        });

                        setImageIndex((prev) => {
                            if (prev < imageCandidates.length - 1) {
                                return prev + 1;
                            }
                            return prev;
                        });
                    }}
                />
            ) : (
                <View style={styles.imageFallback} accessibilityRole="image" accessibilityLabel="Restaurant image unavailable">
                    <Text style={styles.imageFallbackText}>Image unavailable</Text>
                </View>
            )}

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>{safeName}</Text>
                <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
            </View>

            {/* LOCATION */}
            <Text style={styles.location}>
                📍 {safeAddress}
            </Text>

            {/* DESCRIPTION */}
            <Text style={styles.description}>
                {safeDescription}
            </Text>

            {/* FEATURES */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuresContainer}>
                {safeFeatures.map((feature: AccessibilityFeature) => (
                    <View key={feature.id} style={styles.chipWrapper}>
                        <View
                            style={styles.featureBadge}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Feature: ${feature.label}`}
                        >
                            {feature.icon ? <Text style={styles.featureIcon}>{feature.icon}</Text> : null}
                            <Text style={styles.featureText}>{feature.label}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.actionsRow}>
                

                <TouchableOpacity
                    style={[styles.actionButton, styles.directionsButton]}
                    onPress={handleDirections}
                    accessibilityRole="button"
                    accessibilityLabel={`Get directions to ${safeName}`}
                >
                    <Text style={styles.actionButtonText}>Directions</Text>
                </TouchableOpacity>
            </View>

        </Pressable>
    );
};
const createStyles = (theme: AppTheme) => StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: theme.isHighContrast ? 2 : 0,
        borderColor: theme.colors.border,

        shadowColor: theme.colors.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },

        elevation: 3,
    },
    cardPressed: {
        opacity: 0.96,
        transform: [{ scale: 0.995 }],
    },

    image: {
        width: "100%",
        height: 160,
        borderRadius: 14,
        marginBottom: 12,
        backgroundColor: theme.colors.surfaceMuted,
    },

    imageFallback: {
        width: "100%",
        height: 160,
        borderRadius: 14,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surfaceMuted,
    },

    imageFallbackText: {
        color: theme.colors.textSubtle,
        fontSize: 14,
        fontWeight: "500",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.text,
        lineHeight: 24,
        flex: 1,
    },

    rating: {
        fontSize: 14,
        color: theme.colors.accent,
        fontWeight: "600",
        marginLeft: 8,
    },

    location: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSubtle,
    },

    description: {
        marginTop: 12,
        fontSize: 15,
        color: theme.colors.textMuted,
        lineHeight: 22,
    },

    featuresContainer: {
        marginTop: 12,
    },

    chipWrapper: {
        marginRight: 8,
    },

    featureBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.colors.chipBackground,
        borderWidth: theme.isHighContrast ? 2 : 0,
        borderColor: theme.colors.chipBorder,
    },

    featureIcon: {
        marginRight: 6,
        fontSize: 13,
        color: theme.colors.chipText,
    },

    featureText: {
        fontSize: 13,
        color: theme.colors.chipText,
        fontWeight: "500",
    },

    actionsRow: {
        flexDirection: "row",
        marginTop: 14,
    },

    actionButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    reserveButton: {
        backgroundColor: theme.colors.accent,
        marginRight: 8,
    },

    directionsButton: {
        backgroundColor: theme.colors.primary,
        marginLeft: 8,
    },

    actionButtonText: {
        color: theme.colors.primaryText,
        fontSize: 14,
        fontWeight: "700",
    },
});
