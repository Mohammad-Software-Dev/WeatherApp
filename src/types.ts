export type Coords = {
  lat: number;
  lon: number;
};

export const MAP_TYPES = [
  "none",
  "clouds_new",
  "precipitation_new",
  "pressure_new",
  "wind_new",
  "temp_new",
] as const;

export type MapType = (typeof MAP_TYPES)[number];
export type WeatherMapType = Exclude<MapType, "none">;

export type LocationSource = "search" | "map-click" | "device";

export type SelectedLocation = {
  label: string;
  lat: number;
  lon: number;
  source: LocationSource;
};

export function isMapType(value: string): value is MapType {
  return MAP_TYPES.some((mapType) => mapType === value);
}

export function isWeatherMapType(value: MapType): value is WeatherMapType {
  return value !== "none";
}
