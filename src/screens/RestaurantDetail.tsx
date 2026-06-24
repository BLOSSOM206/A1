import React, { useEffect, useMemo, useState } from "react";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Restaurant, RestaurantReview } from "../types/Restaurant";
import { AppTheme, useTheme } from "../theme";
import { useScreenNarration } from "../hooks/useScreenNarration";

type DetailTab = "about" | "photos" | "reviews";

type RestaurantDetailProps = {
    restaurant: Restaurant;
    onBack?: () => void;
    onBookTable?: (restaurant: Restaurant) => void;
};

const menuPlaceholderImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60";

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant, onBack, onBookTable }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [activeTab, setActiveTab] = useState<DetailTab>("about");
    const [imageIndex, setImageIndex] = useState(0);
    const [reviews, setReviews] = useState<RestaurantReview[]>(restaurant.reviews || []);
    const [reviewText, setReviewText] = useState("");
    const [selectedRating, setSelectedRating] = useState(5);
    const [accessibilityRating, setAccessibilityRating] = useState(5);
    const [disabilityType, setDisabilityType] = useState("");
    const [visitContext, setVisitContext] = useState("");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const galleryImages = useMemo(() => {
        const images = restaurant.images && restaurant.images.length > 0 ? restaurant.images : [restaurant.image];
        return images.filter(Boolean);
    }, [restaurant.image, restaurant.images]);

    const menuItems = restaurant.menu || [];
    const activeImage = galleryImages[imageIndex] || restaurant.image;
    const accessibilityFeatures = restaurant.features.map((feature) => feature.label).join(", ") || "No accessibility facilities listed";

    useScreenNarration({
        title: restaurant.name,
        description: [
            `Rating ${restaurant.rating} out of 5.`,
            `Accessibility facilities include ${accessibilityFeatures}.`,
            "Reservation is available from the Book Table button.",
            restaurant.description,
        ],
    });

    useEffect(() => {
        setActiveTab("about");
        setImageIndex(0);
        setReviews(restaurant.reviews || []);
        setReviewText("");
        setSelectedRating(5);
        setAccessibilityRating(5);
        setDisabilityType("");
        setVisitContext("");
        setSelectedImageUri(null);
        setUploadingImage(false);
    }, [restaurant.id, restaurant.image, restaurant.reviews]);

    useEffect(() => {
        let mounted = true;
        const key = `@A1_restaurant_reviews_${restaurant.id}`;

        AsyncStorage.getItem(key)
            .then((storedReviews) => {
                if (!mounted || !storedReviews) {
                    return;
                }

                const parsed = JSON.parse(storedReviews) as RestaurantReview[];
                setReviews([...(parsed || []), ...(restaurant.reviews || [])]);
            })
            .catch(() => undefined);

        return () => {
            mounted = false;
        };
    }, [restaurant.id, restaurant.reviews]);

    const tabs: Array<{ id: DetailTab; label: string }> = useMemo(
        () => [
            { id: "about", label: "About" },
            { id: "photos", label: "Photos" },
            { id: "reviews", label: "Reviews" },
        ],
        []
    );

    const handleBookTable = () => {
        if (onBookTable) {
            onBookTable(restaurant);
            return;
        }

        Alert.alert("Book Table", `Booking flow coming soon for ${restaurant.name}.`);
    };

    const handleDirections = async () => {
        const lat = restaurant.location?.latitude;
        const lon = restaurant.location?.longitude;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            Alert.alert("Directions unavailable", "Restaurant coordinates are missing.");
            return;
        }

        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.log("[RestaurantDetail] Failed to open maps:", error);
            Alert.alert("Directions unavailable", "Could not open Google Maps right now.");
        }
    };

    const handleAddPhoto = () => {
        setUploadingImage(true);
        launchImageLibrary(
            {
                mediaType: "photo",
                selectionLimit: 1,
                quality: 0.8,
            },
            (response) => {
                setUploadingImage(false);

                if (response.didCancel) {
                    return;
                }

                if (response.errorCode) {
                    console.log("[RestaurantDetail] Image picker error:", response.errorCode, response.errorMessage);
                    Alert.alert("Image upload failed", response.errorMessage || "Could not choose an image.");
                    return;
                }

                const uri = response.assets?.[0]?.uri;
                if (uri) {
                    setSelectedImageUri(uri);
                }
            }
        );
    };

    const handleSubmitReview = () => {
        const trimmedComment = reviewText.trim();

        if (!trimmedComment) {
            Alert.alert("Add a review", "Please write a review comment first.");
            return;
        }

        const newReview: RestaurantReview = {
            user: "You",
            rating: selectedRating,
            accessibilityRating,
            disabilityType: disabilityType.trim() || undefined,
            comment: trimmedComment,
            visitContext: visitContext.trim() || undefined,
            image: selectedImageUri || undefined,
        };

        setReviews((currentReviews) => {
            const nextReviews = [newReview, ...currentReviews];
            const userReviews = nextReviews.filter((review) => review.user === "You");
            AsyncStorage.setItem(`@A1_restaurant_reviews_${restaurant.id}`, JSON.stringify(userReviews)).catch(() => undefined);
            return nextReviews;
        });
        setReviewText("");
        setSelectedRating(5);
        setAccessibilityRating(5);
        setDisabilityType("");
        setVisitContext("");
        setSelectedImageUri(null);
        setActiveTab("reviews");
    };

    const renderTabContent = () => {
        if (activeTab === "photos") {
            return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                    {galleryImages.map((imageUri, index) => (
                        <Image
                            key={`${restaurant.id}-photo-${index}`}
                            source={{ uri: imageUri }}
                            style={styles.photoCard}
                            resizeMode="cover"
                            accessibilityRole="image"
                            accessibilityLabel={`${restaurant.name} photo ${index + 1}`}
                            onError={(error) => {
                                console.log("[RestaurantDetail] Gallery image load failed:", {
                                    id: restaurant.id,
                                    image: imageUri,
                                    error: error.nativeEvent,
                                });
                            }}
                        />
                    ))}
                </ScrollView>
            );
        }

        if (activeTab === "reviews") {
            return (
                <View>
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        Reviews
                    </Text>

                    {reviews.map((review, index) => (
                        <View
                            key={`${restaurant.id}-review-${index}`}
                            style={styles.reviewCard}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Review by ${review.user}, rating ${review.rating} out of 5. ${review.comment}`}
                        >
                            <View style={styles.reviewHeaderRow}>
                                <Text style={styles.reviewUser}>{review.user}</Text>
                                <Text style={styles.reviewRating}>{`⭐ ${review.rating}`}</Text>
                            </View>
                            <Text style={styles.reviewComment}>{review.comment}</Text>
                            {review.accessibilityRating ? (
                                <Text style={styles.reviewMeta}>{`Accessibility rating: ${review.accessibilityRating}/5`}</Text>
                            ) : null}
                            {review.disabilityType ? <Text style={styles.reviewMeta}>{`Experience: ${review.disabilityType}`}</Text> : null}
                            {review.visitContext ? <Text style={styles.reviewMeta}>{review.visitContext}</Text> : null}
                            {review.image ? (
                                <Image
                                    source={{ uri: review.image }}
                                    style={styles.reviewImage}
                                    resizeMode="cover"
                                    accessibilityRole="image"
                                    accessibilityLabel={`Review image from ${review.user}`}
                                    onError={(error) => {
                                        console.log("[RestaurantDetail] Review image load failed:", {
                                            id: restaurant.id,
                                            image: review.image,
                                            error: error.nativeEvent,
                                        });
                                    }}
                                />
                            ) : null}
                        </View>
                    ))}

                    <View style={styles.writeReviewSection}>
                        <Text style={styles.sectionTitle} accessibilityRole="header">
                            Write a Review
                        </Text>

                        <TextInput
                            value={reviewText}
                            onChangeText={setReviewText}
                            placeholder="Write your review"
                            placeholderTextColor={theme.colors.textSubtle}
                            multiline
                            style={styles.reviewInput}
                            accessibilityLabel="Review comment input"
                            accessibilityHint="Write your review comment"
                        />

                        <Text style={styles.subSectionLabel} accessibilityRole="header">Overall Rating</Text>
                        <View style={styles.ratingRow}>
                            {Array.from({ length: 5 }, (_, index) => {
                                const value = index + 1;
                                const selected = selectedRating >= value;

                                return (
                                    <TouchableOpacity
                                        key={value}
                                        onPress={() => setSelectedRating(value)}
                                        style={[styles.ratingButton, selected ? styles.ratingButtonSelected : null]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Rate ${value} star${value > 1 ? "s" : ""}`}
                                        accessibilityState={{ selected: selectedRating === value }}
                                    >
                                        <Text style={[styles.ratingButtonText, selected ? styles.ratingButtonTextSelected : null]}>
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.subSectionLabel} accessibilityRole="header">Accessibility Rating</Text>
                        <View style={styles.ratingRow}>
                            {Array.from({ length: 5 }, (_, index) => {
                                const value = index + 1;
                                const selected = accessibilityRating >= value;

                                return (
                                    <TouchableOpacity
                                        key={`access-${value}`}
                                        onPress={() => setAccessibilityRating(value)}
                                        style={[styles.ratingButton, selected ? styles.ratingButtonSelected : null]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Accessibility rating ${value}`}
                                        accessibilityState={{ selected: accessibilityRating === value }}
                                    >
                                        <Text style={[styles.ratingButtonText, selected ? styles.ratingButtonTextSelected : null]}>
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.subSectionLabel}>Disability-specific experience</Text>
                        <TextInput
                            value={disabilityType}
                            onChangeText={setDisabilityType}
                            placeholder="e.g. wheelchair user, sensory sensitivity, low vision"
                            placeholderTextColor={theme.colors.textSubtle}
                            style={styles.reviewSingleInput}
                            accessibilityLabel="Disability-specific experience"
                        />

                        <Text style={styles.subSectionLabel}>Visit context</Text>
                        <TextInput
                            value={visitContext}
                            onChangeText={setVisitContext}
                            placeholder="What helped or got in the way?"
                            placeholderTextColor={theme.colors.textSubtle}
                            multiline
                            style={[styles.reviewSingleInput, styles.visitInput]}
                            accessibilityLabel="Accessibility visit context"
                        />

                        <View style={styles.reviewActionsRow}>
                            <TouchableOpacity
                                style={[styles.secondaryActionButton, uploadingImage ? styles.disabledButton : null]}
                                onPress={handleAddPhoto}
                                disabled={uploadingImage}
                                accessibilityRole="button"
                                accessibilityLabel="Add photo to review"
                            >
                                <Text style={styles.secondaryActionText}>{uploadingImage ? "Opening..." : "Add Photo"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryActionButton, styles.submitReviewButton]}
                                onPress={handleSubmitReview}
                                accessibilityRole="button"
                                accessibilityLabel="Submit review"
                            >
                                <Text style={styles.primaryActionText}>Submit Review</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedImageUri ? (
                            <View style={styles.previewSection}>
                                <Text style={styles.subSectionLabel} accessibilityRole="header">
                                    Uploaded Image Preview
                                </Text>
                                <Image
                                    source={{ uri: selectedImageUri }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                    accessibilityRole="image"
                                    accessibilityLabel="Uploaded image preview"
                                    onError={(error) => {
                                        console.log("[RestaurantDetail] Selected image preview load failed:", {
                                            id: restaurant.id,
                                            image: selectedImageUri,
                                            error: error.nativeEvent,
                                        });
                                    }}
                                />
                            </View>
                        ) : null}
                    </View>
                </View>
            );
        }

        return <Text style={styles.tabContentText}>{restaurant.description}</Text>;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerImageWrapper}>
                <Image
                    source={{ uri: activeImage }}
                    style={styles.headerImage}
                    resizeMode="cover"
                    accessibilityRole="image"
                    accessibilityLabel={`${restaurant.name} image`}
                    onError={(error) => {
                        console.log("[RestaurantDetail] Image load failed:", {
                            id: restaurant.id,
                            image: activeImage,
                            error: error.nativeEvent,
                        });

                        setImageIndex((prev) => {
                            if (prev < galleryImages.length - 1) {
                                return prev + 1;
                            }
                            return prev;
                        });
                    }}
                />
                {onBack ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.name} accessibilityRole="header">
                    {restaurant.name}
                </Text>
                <Text style={styles.rating} accessibilityLabel={`Rating ${restaurant.rating} out of 5`}>
                    {`⭐ ${restaurant.rating}`}
                </Text>
                <Text style={styles.location}>{`📍 ${restaurant.location.address}`}</Text>
                <Text style={styles.description}>{restaurant.description}</Text>
            </View>

            <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                    Accessibility Features
                </Text>
                <View style={styles.featuresWrap}>
                    {restaurant.features.map((feature) => (
                        <View
                            key={feature.id}
                            style={styles.featureBadge}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Accessibility feature ${feature.label}`}
                        >
                            <Text style={styles.featureText}>{feature.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tabButton, activeTab === tab.id ? styles.tabButtonActive : null]}
                        onPress={() => setActiveTab(tab.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`${tab.label} tab`}
                        accessibilityHint={`Show ${tab.label.toLowerCase()} information for this restaurant`}
                        accessibilityState={{ selected: activeTab === tab.id }}
                    >
                        <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : null]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.tabContent}>{renderTabContent()}</View>

            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                    Menu
                </Text>

                <View style={styles.menuList}>
                    {menuItems.map((item, index) => (
                        <View
                            key={`${restaurant.id}-menu-${index}`}
                            style={styles.menuCard}
                            accessible
                            accessibilityRole="text"
                            accessibilityLabel={`Menu item ${item.name}, price ${item.price} rupees${item.description ? `. ${item.description}` : ""}`}
                        >
                            <Image
                                source={{ uri: item.image || menuPlaceholderImage }}
                                style={styles.menuImage}
                                resizeMode="cover"
                                accessibilityRole="image"
                                accessibilityLabel={`${item.name} image`}
                                onError={(error) => {
                                    console.log("[RestaurantDetail] Menu image load failed:", {
                                        id: restaurant.id,
                                        image: item.image || menuPlaceholderImage,
                                        error: error.nativeEvent,
                                    });
                                }}
                            />

                            <View style={styles.menuCardBody}>
                                <Text style={styles.menuName}>{item.name}</Text>
                                {item.description ? <Text style={styles.menuDescription}>{item.description}</Text> : null}
                                <Text style={styles.menuPrice}>{`₹${item.price}`}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.bookButton]}
                    onPress={handleBookTable}
                    accessibilityRole="button"
                    accessibilityLabel={`Book a table at ${restaurant.name}`}
                    accessibilityHint="Open reservation details for this restaurant"
                >
                    <Text style={styles.actionText}>Book Table</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.directionsButton]}
                    onPress={handleDirections}
                    accessibilityRole="button"
                    accessibilityLabel={`Open directions to ${restaurant.name}`}
                    accessibilityHint="Open this restaurant location in Google Maps"
                >
                    <Text style={styles.actionText}>Directions</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        paddingBottom: 28,
    },
    headerImageWrapper: {
        position: "relative",
    },
    headerImage: {
        width: "100%",
        height: 240,
        backgroundColor: theme.colors.surfaceMuted,
    },
    backButton: {
        position: "absolute",
        top: 16,
        left: 16,
        backgroundColor: theme.colors.overlay,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    backButtonText: {
        color: theme.colors.primaryText,
        fontSize: 13,
        fontWeight: "700",
    },
    infoSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    name: {
        fontSize: 25,
        fontWeight: "800",
        color: theme.colors.text,
    },
    rating: {
        marginTop: 8,
        fontSize: 16,
        color: theme.colors.text,
    },
    location: {
        marginTop: 6,
        fontSize: 15,
        color: theme.colors.textMuted,
    },
    description: {
        marginTop: 12,
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textMuted,
    },
    featuresSection: {
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: 10,
    },
    featuresWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    featureBadge: {
        backgroundColor: theme.colors.chipBackground,
        borderColor: theme.colors.chipBorder,
        borderWidth: theme.isHighContrast ? 2 : 1,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    featureText: {
        color: theme.colors.chipText,
        fontSize: 13,
        fontWeight: "600",
    },
    tabsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: theme.colors.secondary,
        marginRight: 8,
    },
    tabButtonActive: {
        backgroundColor: theme.colors.accent,
    },
    tabText: {
        fontSize: 13,
        color: theme.colors.secondaryText,
        fontWeight: "600",
    },
    tabTextActive: {
        color: theme.colors.accentText,
    },
    tabContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    tabContentText: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.textMuted,
    },
    photosRow: {
        paddingRight: 16,
    },
    photoCard: {
        width: 220,
        height: 160,
        borderRadius: 16,
        marginRight: 10,
        backgroundColor: "#E5E7EB",
    },
    reviewCard: {
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: theme.isHighContrast ? 2 : 1,
        borderColor: theme.colors.border,
    },
    reviewHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    reviewUser: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.text,
    },
    reviewRating: {
        fontSize: 13,
        color: theme.colors.accent,
        fontWeight: "600",
    },
    reviewComment: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textMuted,
    },
    reviewMeta: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 18,
        color: theme.colors.primary,
        fontWeight: "700",
    },
    reviewImage: {
        width: "100%",
        height: 180,
        marginTop: 12,
        borderRadius: 14,
        backgroundColor: "#E5E7EB",
    },
    writeReviewSection: {
        marginTop: 10,
        paddingTop: 8,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minHeight: 100,
        textAlignVertical: "top",
        color: theme.colors.text,
        backgroundColor: theme.colors.inputBackground,
    },
    reviewSingleInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: theme.colors.text,
        backgroundColor: theme.colors.inputBackground,
        fontSize: 15,
    },
    visitInput: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    subSectionLabel: {
        marginTop: 12,
        marginBottom: 8,
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.text,
    },
    ratingRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    ratingButton: {
        width: 42,
        height: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
    },
    ratingButtonSelected: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    ratingButtonText: {
        color: theme.colors.text,
        fontWeight: "700",
    },
    ratingButtonTextSelected: {
        color: theme.colors.accentText,
    },
    reviewActionsRow: {
        flexDirection: "row",
        marginTop: 8,
    },
    primaryActionButton: {
        flex: 1,
        borderRadius: 12,
        minHeight: 46,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryActionButton: {
        flex: 1,
        borderRadius: 12,
        minHeight: 46,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.secondary,
        marginRight: 8,
    },
    disabledButton: {
        opacity: 0.65,
    },
    secondaryActionText: {
        color: theme.colors.secondaryText,
        fontSize: 14,
        fontWeight: "700",
    },
    submitReviewButton: {
        backgroundColor: theme.colors.primary,
    },
    primaryActionText: {
        color: theme.colors.primaryText,
        fontSize: 14,
        fontWeight: "700",
    },
    previewSection: {
        marginTop: 14,
    },
    previewImage: {
        width: "100%",
        height: 180,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceMuted,
    },
    menuSection: {
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    menuList: {
        marginTop: 6,
    },
    menuCard: {
        flexDirection: "row",
        padding: 12,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        borderWidth: theme.isHighContrast ? 2 : 1,
        borderColor: theme.colors.border,
        marginBottom: 12,
        shadowColor: theme.colors.shadow,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    menuImage: {
        width: 88,
        height: 88,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceMuted,
    },
    menuImageFallback: {
        width: 88,
        height: 88,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    menuFallbackText: {
        color: theme.colors.textSubtle,
        fontSize: 12,
        fontWeight: "600",
    },
    menuCardBody: {
        flex: 1,
        paddingLeft: 12,
        justifyContent: "center",
    },
    menuName: {
        fontSize: 15,
        fontWeight: "700",
        color: theme.colors.text,
    },
    menuDescription: {
        marginTop: 4,
        fontSize: 13,
        color: theme.colors.textMuted,
        lineHeight: 18,
    },
    menuPrice: {
        marginTop: 8,
        fontSize: 15,
        color: theme.colors.primary,
        fontWeight: "800",
    },
    actionsRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 18,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        minHeight: 46,
        alignItems: "center",
        justifyContent: "center",
    },
    bookButton: {
        backgroundColor: theme.colors.accent,
        marginRight: 8,
    },
    directionsButton: {
        backgroundColor: theme.colors.primary,
        marginLeft: 8,
    },
    actionText: {
        color: theme.colors.primaryText,
        fontSize: 14,
        fontWeight: "700",
    },
});
