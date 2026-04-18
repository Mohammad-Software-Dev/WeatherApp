import { getGeocode } from "@/api";
import { formatLocationLabel } from "@/lib/location";
import { cn } from "@/lib/utils";
import type { SelectedLocation } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type Props = {
  selectedLocation: SelectedLocation | null;
  onSelectLocation: (location: SelectedLocation) => void;
};

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 8;

export default function LocationDropdown({
  selectedLocation,
  onSelectLocation,
}: Props) {
  const [query, setQuery] = useState(selectedLocation?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(selectedLocation?.label ?? "");
  }, [selectedLocation?.label]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  const {
    data: searchResults = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["geocode-search", debouncedQuery],
    queryFn: () => getGeocode(debouncedQuery, { count: RESULT_LIMIT }),
    enabled: debouncedQuery.trim().length >= MIN_SEARCH_LENGTH,
  });

  const shouldShowResults =
    isOpen && debouncedQuery.trim().length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const resultItems = useMemo(
    () =>
      searchResults.map((result) => ({
        label: formatLocationLabel(result),
        lat: result.lat,
        lon: result.lon,
      })),
    [searchResults]
  );

  const onSelect = (index: number) => {
    const selected = resultItems[index];
    if (!selected) {
      return;
    }

    onSelectLocation({
      label: selected.label,
      lat: selected.lat,
      lon: selected.lon,
      source: "search",
    });
    setQuery(selected.label);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowResults || resultItems.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, resultItems.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onSelect(activeIndex);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full min-w-0">
      <input
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-background/40 px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] w-full"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
          }
          setIsOpen(true);
        }}
        onBlur={() => {
          closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search city or place"
        aria-label="Search location"
      />

      {shouldShowResults && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-md border shadow-md bg-popover z-1001 max-h-64 overflow-y-auto p-1">
          {isFetching && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching...</p>
          )}

          {!isFetching && isError && (
            <div className="px-2 py-1.5 text-sm flex items-center justify-between gap-2">
              <span className="text-destructive">Couldn't search locations.</span>
              <button
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void refetch()}
                className="underline underline-offset-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {!isFetching && !isError && resultItems.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
          )}

          {!isFetching &&
            !isError &&
            resultItems.map((item, index) => (
              <button
                key={`${item.label}-${item.lat}-${item.lon}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(index)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-sm rounded-sm cursor-pointer",
                  index === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/70"
                )}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, value]);

  return debouncedValue;
}
