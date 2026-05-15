import { curatedRestaurants } from "../../data/restaurants";
import { Restaurant } from "../types/Restaurant";

const normalizeFeatureId = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const getStaticRestaurants = (): Restaurant[] =>
  curatedRestaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    image: restaurant.image,
    rating: restaurant.rating,
    location: {
      address: restaurant.city,
      latitude: restaurant.lat,
      longitude: restaurant.lon,
    },
    features: restaurant.accessibility.map((label) => ({
      id: normalizeFeatureId(label),
      label,
    })),
    cuisine: "curated",
  }));