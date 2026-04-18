import HourlyForecast from "./components/cards/HourlyForecast";
import CurrentWeather from "./components/cards/CurrentWeather";
import AdditionalInfo from "./components/cards/AdditionalInfo";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  isMapType,
  isWeatherMapType,
  type Coords,
  type MapType,
  type SelectedLocation,
} from "./types";
import LocationDropdown from "./components/dropdowns/LocationDropdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGeocode, reverseGeocode } from "./api";
import { formatLocationLabel } from "./lib/location";
import MapTypeDropdown from "./components/dropdowns/MapTypeDropdown";
import MobileHeader from "./components/MobileHeader";
import LightDarkToggle from "./components/LightDarkToggle";
import QueryErrorBoundary from "./components/QueryErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import { LocateFixed } from "lucide-react";

const LOCATION_STORAGE_KEY = "weather-app.location";
const MAP_TYPE_STORAGE_KEY = "weather-app.map-type";
const DEFAULT_LOCATION_QUERY = "Tokyo";

const LazyMap = lazy(() => import("./components/Map"));
const LazyMapLegend = lazy(() => import("./components/MapLegend"));

function App() {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    getInitialSelectedLocation
  );
  const [bootstrapQuery, setBootstrapQuery] = useState<string | null>(
    getInitialBootstrapQuery
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>(() => {
    const storedMapType =
      typeof window !== "undefined"
        ? window.localStorage.getItem(MAP_TYPE_STORAGE_KEY)
        : null;
    if (storedMapType && isMapType(storedMapType)) {
      return storedMapType;
    }
    return "none";
  });

  const {
    data: bootstrapGeocodeData,
    isFetching: isBootstrapFetching,
    isError: isBootstrapError,
    refetch: retryBootstrapLocation,
  } = useQuery({
    queryKey: ["geocode-bootstrap", bootstrapQuery],
    queryFn: () => getGeocode(bootstrapQuery!, { count: 1 }),
    enabled: !selectedLocation && Boolean(bootstrapQuery),
    retry: 1,
  });

  useEffect(() => {
    if (selectedLocation || !bootstrapGeocodeData?.[0]) {
      return;
    }

    const result = bootstrapGeocodeData[0];
    setSelectedLocation({
      label: formatLocationLabel(result),
      lat: result.lat,
      lon: result.lon,
      source: "search",
    });
    setBootstrapQuery(null);
  }, [bootstrapGeocodeData, selectedLocation]);

  useEffect(() => {
    window.localStorage.setItem(MAP_TYPE_STORAGE_KEY, mapType);
  }, [mapType]);

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }
    window.localStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(selectedLocation)
    );
  }, [selectedLocation]);

  const onMapClick = (lat: number, lon: number) => {
    setSelectedLocation({
      label: `Custom pin (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
      lat,
      lon,
      source: "map-click",
    });
    setBootstrapQuery(null);
    setLocateError(null);
  };

  const onLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Update map/weather immediately, then refine label asynchronously.
        setSelectedLocation({
          label: "Current location",
          lat: latitude,
          lon: longitude,
          source: "device",
        });
        setBootstrapQuery(null);

        void reverseGeocode(latitude, longitude)
          .then((place) => {
            const resolvedLabel = resolveDeviceLocationLabel(place);
            if (!resolvedLabel) {
              return;
            }

            setSelectedLocation((previous) => {
              if (!previous || previous.source !== "device") {
                return previous;
              }

              const sameCoords =
                Math.abs(previous.lat - latitude) < 1e-6 &&
                Math.abs(previous.lon - longitude) < 1e-6;
              if (!sameCoords) {
                return previous;
              }

              return {
                ...previous,
                label: resolvedLabel,
              };
            });
          })
          .finally(() => {
            setIsLocating(false);
          });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied."
            : error.code === error.TIMEOUT
            ? "Location request timed out."
            : "Could not fetch your location.";
        setLocateError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const coords: Coords | null = selectedLocation
    ? { lat: selectedLocation.lat, lon: selectedLocation.lon }
    : null;
  const weatherResetKey = coords
    ? `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`
    : "no-coords";

  const retryAll = () => {
    void queryClient.invalidateQueries();
  };

  const mapLoadingFallback = (
    <div className="size-full rounded-xl border p-4 bg-card flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  );

  return (
    <>
      <MobileHeader />
      <div className="flex flex-col gap-5 pt-3 p-4 xs:p-5 md:p-6 xs:pt-6 min-w-0 lg:h-[100dvh] lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 min-w-0 lg:h-full">
          <div className="flex flex-col gap-4 min-w-0 lg:min-h-0 lg:grid lg:grid-rows-[auto_minmax(0,1fr)]">
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-3 xs:gap-4 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                  <div className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5 flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0 w-16">
                        Location
                      </p>
                      <div className="flex-1 min-w-0">
                        <LocationDropdown
                          selectedLocation={selectedLocation}
                          onSelectLocation={(location) => {
                            setSelectedLocation(location);
                            setBootstrapQuery(null);
                            setLocateError(null);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onLocateMe}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2 py-1 text-xs font-medium hover:bg-accent/70 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        <LocateFixed className="size-3.5" />
                        {isLocating ? "Locating..." : "Locate me"}
                      </button>
                    </div>
                    {locateError && (
                      <p className="text-xs text-destructive">{locateError}</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5 flex items-center gap-2 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0 w-20">
                      Map Layer
                    </p>
                    <div className="flex-1 min-w-0">
                      <MapTypeDropdown mapType={mapType} setMapType={setMapType} />
                    </div>
                  </div>
                </div>
                <div className="hidden xs:flex xl:justify-end items-start xl:items-center">
                  <LightDarkToggle />
                </div>
              </div>
              {!selectedLocation && isBootstrapFetching && (
                <p className="text-sm text-muted-foreground">
                  Resolving default location...
                </p>
              )}
              {!selectedLocation && isBootstrapError && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-destructive">
                    Could not resolve the default location.
                  </p>
                  <button
                    onClick={() => void retryBootstrapLocation()}
                    className="text-sm text-destructive underline underline-offset-4 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 min-h-0 lg:grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="relative h-88 md:h-96 lg:h-auto lg:min-h-0 col-span-1 md:col-span-2 lg:col-span-3 order-1 lg:row-start-1">
                {coords ? (
                  <Suspense fallback={mapLoadingFallback}>
                    <LazyMap
                      coords={coords}
                      onMapClick={onMapClick}
                      mapType={mapType}
                    />
                    {isWeatherMapType(mapType) && (
                      <LazyMapLegend mapType={mapType} />
                    )}
                  </Suspense>
                ) : (
                  mapLoadingFallback
                )}
              </div>
              <div className="col-span-1 lg:col-span-1 order-2 min-h-0 lg:row-start-2">
                <QueryErrorBoundary
                  title="Current Weather"
                  onRetry={retryAll}
                  resetKey={weatherResetKey}
                >
                  <CurrentWeather coords={coords} />
                </QueryErrorBoundary>
              </div>
              <div className="col-span-1 lg:col-span-2 order-3 min-h-0 lg:row-start-2">
                <QueryErrorBoundary
                  title="Today at a Glance"
                  onRetry={retryAll}
                  resetKey={weatherResetKey}
                >
                  <AdditionalInfo coords={coords} />
                </QueryErrorBoundary>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 min-w-0 lg:min-h-0">
            <QueryErrorBoundary
              title="Hourly Forecast"
              onRetry={retryAll}
              resetKey={weatherResetKey}
            >
              <HourlyForecast coords={coords} />
            </QueryErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}

function resolveDeviceLocationLabel(
  place: Awaited<ReturnType<typeof reverseGeocode>>
) {
  if (!place) {
    return null;
  }

  const name = place.name?.trim();
  const state = place.state?.trim();
  const country = place.country?.trim();

  if (name && state && country && name.toLowerCase() !== state.toLowerCase()) {
    return `${name}, ${state}, ${country}`;
  }
  if (name && country) {
    return `${name}, ${country}`;
  }
  if (name) {
    return name;
  }
  if (state && country) {
    return `${state}, ${country}`;
  }
  if (country) {
    return country;
  }
  return null;
}

type StoredLocationRead = {
  selectedLocation: SelectedLocation | null;
  bootstrapQuery: string | null;
};

function readStoredLocation(): StoredLocationRead {
  if (typeof window === "undefined") {
    return {
      selectedLocation: null,
      bootstrapQuery: DEFAULT_LOCATION_QUERY,
    };
  }

  const rawLocation = window.localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!rawLocation) {
    return {
      selectedLocation: null,
      bootstrapQuery: DEFAULT_LOCATION_QUERY,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawLocation);
    if (
      parsed &&
      typeof parsed === "object" &&
      "label" in parsed &&
      "lat" in parsed &&
      "lon" in parsed &&
      "source" in parsed &&
      typeof parsed.label === "string" &&
      typeof parsed.lat === "number" &&
      typeof parsed.lon === "number" &&
      (parsed.source === "search" ||
        parsed.source === "map-click" ||
        parsed.source === "device")
    ) {
      return {
        selectedLocation: parsed as SelectedLocation,
        bootstrapQuery: null,
      };
    }
  } catch {
    if (rawLocation.trim().length > 0) {
      return {
        selectedLocation: null,
        bootstrapQuery: rawLocation.trim(),
      };
    }
  }

  return {
    selectedLocation: null,
    bootstrapQuery: DEFAULT_LOCATION_QUERY,
  };
}

function getInitialSelectedLocation() {
  return readStoredLocation().selectedLocation;
}

function getInitialBootstrapQuery() {
  return readStoredLocation().bootstrapQuery;
}

export default App;
