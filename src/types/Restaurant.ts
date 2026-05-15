export interface Restaurant {
    id: string;
    name: string;
    description: string;
    image: string;
    images?: string[];
    rating: number;
    location: {
        address: string;
        latitude: number;
        longitude: number;
    }
    features: AccessibilityFeature[];
    menu?: RestaurantMenuItem[];
    reviews?: RestaurantReview[];
    cuisine: string;

}
export interface AccessibilityFeature {
    id: string;
    label: string;
    icon?: string;
}

export interface filter {
    id: string;
    label: string;
    icon: string;

}

export interface RestaurantMenuItem {
    name: string;
    price: number;
    image?: string;
    description?: string;
}

export interface RestaurantReview {
    user: string;
    rating: number;
    accessibilityRating?: number;
    disabilityType?: string;
    comment: string;
    visitContext?: string;
    image?: string;
}
