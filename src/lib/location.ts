import type { Geocode } from "@/api";

type GeocodeResult = Geocode[number];

export function formatLocationLabel(location: GeocodeResult): string {
  return [location.name, location.state, location.country]
    .filter(Boolean)
    .join(", ");
}
