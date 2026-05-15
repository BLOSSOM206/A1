import React, { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FilterChip } from "../components/filters/FilterChip";
import { RestaurantCard } from "../components/Restaurant/RestaurantCards";
import { Restaurant } from "../types/Restaurant";
import { curatedRestaurants } from "../../data/restaurants";
import { AppTheme, useTheme } from "../theme";



const FILTER_OPTIONS = [
    { id: "wheelchair", label: "Wheelchair" },
    { id: "accessible-seating", label: "Accessible Seating" },
    { id: "spacious-layout", label: "Spacious Layout" },
    { id: "accessible-restroom", label: "Accessible Restroom" },
    { id: "quiet-environment", label: "Quiet Environment" },
    { id: "braille-menus", label: "Braille Menus" },
];

const normalizeFeatureId = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const getRestaurantBasePrice = (restaurant: Restaurant): number | null => {
    if (!restaurant.menu || restaurant.menu.length === 0) return null;
    return Math.min(...restaurant.menu.map((item) => item.price));
};

const filterRestaurants = (
    source: Restaurant[],
    queryText: string,
    featureFilters: string[],
    budget: number | null
) => {
    const query = queryText.trim().toLowerCase();

    return source.filter((restaurant) => {
        const matchesSearch =
            !query ||
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.location.address.toLowerCase().includes(query) ||
            restaurant.description.toLowerCase().includes(query);

        const matchesFeatureFilters =
            featureFilters.length === 0 ||
            featureFilters.every((selectedId) =>
                restaurant.features.some((feature) => feature.id === selectedId)
            );

        const price = getRestaurantBasePrice(restaurant);
        const matchesBudget = budget == null || (price != null && price <= budget);

        return matchesSearch && matchesFeatureFilters && matchesBudget;
    });
};

const staticRestaurants: Restaurant[] = curatedRestaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image,
    images: restaurant.images,
    rating: restaurant.rating,
    location: {
        address: restaurant.city,
        latitude: restaurant.lat,
        longitude: restaurant.lon,
    },
    features: [
        ...restaurant.accessibility,
        ...(restaurant.id === "lotus-cafe" || restaurant.id === "by-the-mekong" ? ["Quiet Environment"] : []),
        ...(restaurant.id === "masala-library" || restaurant.id === "lotus-cafe" ? ["Braille Menus"] : []),
    ].map((label) => ({
        id: normalizeFeatureId(label),
        label,
    })),
    menu: restaurant.menu,
    reviews: restaurant.reviews,
    cuisine: "curated",
}));

type TestScreenProps = {
    onRestaurantPress?: (restaurant: Restaurant) => void;
};

export const TestScreen: React.FC<TestScreenProps> = ({ onRestaurantPress }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const toggleFilter = (filterId: string) => {
        setSelectedFilters((prev) =>
            prev.includes(filterId)
                ? prev.filter((id) => id !== filterId)
                : [...prev, filterId]
        );
    };

    const filteredRestaurants = useMemo(
        () => filterRestaurants(restaurants, searchText, selectedFilters, null),
        [restaurants, searchText, selectedFilters]
    );

    useEffect(() => {
        setRestaurants(staticRestaurants);
        setLoading(false);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    placeholder="Search restaurants, locations, or cuisines"
                    placeholderTextColor={theme.colors.textSubtle}
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchBar}
                    accessibilityLabel="Search restaurants"
                    accessibilityHint="Type a restaurant name, location, or cuisine"
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterRowContent}
            >
                {FILTER_OPTIONS.map((filter) => (
                    <View key={filter.id} style={styles.chipWrapper}>
                        <FilterChip
                            label={filter.label}
                            isSelected={selectedFilters.includes(filter.id)}
                            onPress={() => toggleFilter(filter.id)}
                        />
                    </View>
                ))}
            </ScrollView>

            {loading ? (
                <Text style={styles.loadingText}>Loading restaurants...</Text>
            ) : (
                <FlatList
                    data={filteredRestaurants}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    keyboardShouldPersistTaps="handled"
                    contentInsetAdjustmentBehavior="automatic"
                    ListEmptyComponent={
                        <View style={styles.emptyState} accessible accessibilityRole="text" accessibilityLabel="No restaurants found">
                            <Text style={styles.emptyStateTitle}>No restaurants found</Text>
                            <Text style={styles.emptyStateText}>Try a different search or clear some filters.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <RestaurantCard
                            restaurant={item}
                            onPress={() => {
                                onRestaurantPress?.(item);
                            }}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    searchBarContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },

    searchBar: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: theme.isHighContrast ? 2 : 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    filterRow: {
        paddingBottom: 12,
    },

    filterRowContent: {
        paddingHorizontal: 16,
    },

    loadingText: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },

    chipWrapper: {
        marginRight: 8,
    },

    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 104,
    },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        paddingHorizontal: 16,
    },

    emptyStateTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.text,
    },

    emptyStateText: {
        marginTop: 6,
        fontSize: 14,
        color: theme.colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
});
