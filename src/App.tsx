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
import { getGeocode } from "./api";
import { formatLocationLabel } from "./lib/location";
import MapTypeDropdown from "./components/dropdowns/MapTypeDropdown";
import MobileHeader from "./components/MobileHeader";
import LightDarkToggle from "./components/LightDarkToggle";
import QueryErrorBoundary from "./components/QueryErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";

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
  };

  const coords: Coords | null = selectedLocation
    ? { lat: selectedLocation.lat, lon: selectedLocation.lon }
    : null;

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
      <div className="flex flex-col gap-5 pt-3 p-4 xs:p-5 md:p-6 xs:pt-6 min-w-0 lg:min-h-[100dvh]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 lg:gap-6 min-w-0">
          <div className="flex flex-col gap-5 min-w-0 lg:min-h-0">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-3 xs:gap-4 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                <div className="rounded-lg border border-border/70 bg-card/50 p-3 flex flex-col gap-2 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Location
                  </p>
                  <LocationDropdown
                    selectedLocation={selectedLocation}
                    onSelectLocation={(location) => {
                      setSelectedLocation(location);
                      setBootstrapQuery(null);
                    }}
                  />
                </div>
                <div className="rounded-lg border border-border/70 bg-card/50 p-3 flex flex-col gap-2 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Map Layer
                  </p>
                  <MapTypeDropdown mapType={mapType} setMapType={setMapType} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 lg:min-h-0">
              <div className="relative h-88 md:h-96 lg:h-[38dvh] col-span-1 md:col-span-2 lg:col-span-3 order-1">
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
              <div className="col-span-1 lg:col-span-1 order-2 min-h-0">
                <QueryErrorBoundary title="Current Weather" onRetry={retryAll}>
                  <CurrentWeather coords={coords} />
                </QueryErrorBoundary>
              </div>
              <div className="col-span-1 lg:col-span-2 order-3 min-h-0">
                <QueryErrorBoundary title="Today at a Glance" onRetry={retryAll}>
                  <AdditionalInfo coords={coords} />
                </QueryErrorBoundary>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 min-w-0 lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4">
            <QueryErrorBoundary title="Hourly Forecast" onRetry={retryAll}>
              <HourlyForecast coords={coords} />
            </QueryErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
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
      (parsed.source === "search" || parsed.source === "map-click")
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
