export type CuratedRestaurant = {
    id: string;
    name: string;
    city: "Mumbai";
    lat: number;
    lon: number;
    rating: number;
    description: string;
    accessibility: string[];
    image: string;
    images: string[];
    menu: { name: string; price: number; image: string; description?: string }[];
    reviews: { user: string; rating: number; comment: string; image?: string }[];
};

const restaurantImages = [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
];

const imageForIndex = (index: number) =>
    `${restaurantImages[index % restaurantImages.length]}?auto=format&fit=crop&w=800&q=60`;

const imageSetForIndex = (index: number) => {
    const first = imageForIndex(index);
    const second = imageForIndex(index + 1);
    const third = imageForIndex(index + 2);
    return [first, second, third];
};

const menuImages = [
    "https://images.unsplash.com/photo-1529042410759-befb1204b468",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
];

const menuImageForIndex = (index: number) =>
    `${menuImages[index % menuImages.length]}?auto=format&fit=crop&w=800&q=60`;

const buildMenu = (basePrice: number, seedIndex: number) => [
    {
        name: "Chef Special Platter",
        price: basePrice + 180,
        image: menuImageForIndex(seedIndex),
        description: "A curated tasting plate with the restaurant's most popular items.",
    },
    {
        name: "Seasonal Small Plate",
        price: basePrice + 90,
        image: menuImageForIndex(seedIndex + 1),
        description: "Light bite with rotating seasonal ingredients and fresh garnish.",
    },
    {
        name: "Signature Dessert",
        price: basePrice + 60,
        image: menuImageForIndex(seedIndex + 2),
        description: "Rich finish to the meal with a house-style dessert.",
    },
];

const buildReviews = (restaurantName: string, seedIndex: number) => [
    {
        user: "Aarav",
        rating: 5,
        comment: `${restaurantName} has thoughtful accessibility and comfortable seating.`,
        image: imageForIndex(seedIndex),
    },
    {
        user: "Mira",
        rating: 4,
        comment: `The food and service at ${restaurantName} feel polished and dependable.`,
    },
    {
        user: "Karan",
        rating: 5,
        comment: `Easy to navigate and ideal for a relaxed meal with friends.`,
    },
];

export const curatedRestaurants: CuratedRestaurant[] = [
    {
        id: "masala-library",
        name: "Masala Library",
        city: "Mumbai",
        lat: 19.0668,
        lon: 72.8679,
        rating: 4.5,
        description:
            "Progressive Indian fine dining in Bandra Kurla Complex with elevator access and wide circulation near most tables.",
        accessibility: ["Wheelchair", "Accessible Seating", "Spacious Layout"],
        image: imageForIndex(0),
        images: imageSetForIndex(0),
        menu: buildMenu(420, 0),
        reviews: buildReviews("Masala Library", 0),
    },
    {
        id: "yazu",
        name: "Yazu",
        city: "Mumbai",
        lat: 19.1133,
        lon: 72.8354,
        rating: 4.3,
        description:
            "Modern pan-Asian restaurant in Andheri with comfortable aisle spacing and seating sections suitable for assisted movement.",
        accessibility: ["Accessible Seating", "Spacious Layout"],
        image: imageForIndex(1),
        images: imageSetForIndex(1),
        menu: buildMenu(360, 1),
        reviews: buildReviews("Yazu", 1),
    },
    {
        id: "yauatcha",
        name: "Yauatcha",
        city: "Mumbai",
        lat: 19.0607,
        lon: 72.868,
        rating: 4.4,
        description:
            "Contemporary dim sum restaurant in BKC with step-free entry zones and practical table spacing for mobility users.",
        accessibility: ["Wheelchair", "Accessible Seating", "Spacious Layout"],
        image: imageForIndex(2),
        images: imageSetForIndex(2),
        menu: buildMenu(390, 2),
        reviews: buildReviews("Yauatcha", 2),
    },
    {
        id: "the-bombay-cartel",
        name: "The Bombay Cartel",
        city: "Mumbai",
        lat: 18.9956,
        lon: 72.8258,
        rating: 4.2,
        description:
            "Asian dining destination in Lower Parel's commercial district with broad indoor pathways and wheelchair-friendly movement routes.",
        accessibility: ["Wheelchair", "Spacious Layout"],
        image: imageForIndex(3),
        images: imageSetForIndex(3),
        menu: buildMenu(340, 3),
        reviews: buildReviews("The Bombay Cartel", 3),
    },
    {
        id: "shy-cafe-and-bar",
        name: "Shy Cafe & Bar",
        city: "Mumbai",
        lat: 19.0596,
        lon: 72.8293,
        rating: 4.1,
        description:
            "Bandra neighborhood cafe-bar with ground-level access areas, supportive seating choices, and circulation space around key sections.",
        accessibility: ["Wheelchair", "Accessible Seating"],
        image: imageForIndex(4),
        images: imageSetForIndex(4),
        menu: buildMenu(280, 4),
        reviews: buildReviews("Shy Cafe & Bar", 4),
    },
    {
        id: "lotus-cafe",
        name: "Lotus Cafe",
        city: "Mumbai",
        lat: 19.1035,
        lon: 72.8267,
        rating: 4.5,
        description:
            "All-day dining at JW Marriott Juhu with hotel-grade accessibility standards, including accessible restrooms and step-free routes.",
        accessibility: ["Wheelchair", "Accessible Seating", "Accessible Restroom", "Spacious Layout"],
        image: imageForIndex(5),
        images: imageSetForIndex(5),
        menu: buildMenu(410, 5),
        reviews: buildReviews("Lotus Cafe", 5),
    },
    {
        id: "earth-cafe-waterfield",
        name: "Earth Cafe @ Waterfield",
        city: "Mumbai",
        lat: 19.0609,
        lon: 72.8346,
        rating: 4.2,
        description:
            "Casual cafe on Waterfield Road with practical entry, flexible seating arrangements, and a relatively open floor plan.",
        accessibility: ["Accessible Seating", "Spacious Layout"],
        image: imageForIndex(6),
        images: imageSetForIndex(6),
        menu: buildMenu(240, 6),
        reviews: buildReviews("Earth Cafe @ Waterfield", 6),
    },
    {
        id: "by-the-mekong",
        name: "By The Mekong",
        city: "Mumbai",
        lat: 18.9948,
        lon: 72.8258,
        rating: 4.6,
        description:
            "Fine-dining Asian venue at The St. Regis with dedicated hotel accessibility infrastructure and accessible washroom availability.",
        accessibility: ["Wheelchair", "Accessible Seating", "Accessible Restroom", "Spacious Layout"],
        image: imageForIndex(7),
        images: imageSetForIndex(7),
        menu: buildMenu(430, 7),
        reviews: buildReviews("By The Mekong", 7),
    },
    {
        id: "saz-cafe",
        name: "Saz Cafe",
        city: "Mumbai",
        lat: 19.0618,
        lon: 72.8341,
        rating: 4.0,
        description:
            "Long-standing Bandra cafe concept with approachable entry sections and table options that support varied seating requirements.",
        accessibility: ["Accessible Seating", "Spacious Layout"],
        image: imageForIndex(8),
        images: imageSetForIndex(8),
        menu: buildMenu(260, 8),
        reviews: buildReviews("Saz Cafe", 8),
    },
    {
        id: "nom-nom",
        name: "Nom Nom",
        city: "Mumbai",
        lat: 19.0699,
        lon: 72.8362,
        rating: 4.1,
        description:
            "Contemporary Mumbai dining spot known for compact but usable circulation and seating sections that can accommodate mobility needs.",
        accessibility: ["Wheelchair", "Accessible Seating"],
        image: imageForIndex(9),
        images: imageSetForIndex(9),
        menu: buildMenu(300, 9),
        reviews: buildReviews("Nom Nom", 9),
    },
];