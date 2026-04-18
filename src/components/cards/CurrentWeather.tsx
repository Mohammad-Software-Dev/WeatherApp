import { useQuery } from "@tanstack/react-query";
import { getWeather } from "../../api";
import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import type { Coords } from "../../types";
import CurrentSkeleton from "../skeletons/CurrentSkeleton";

type Props = {
  coords: Coords | null;
};
export default function CurrentWeather({ coords }: Props) {
  const { data, error, isPending } = useQuery({
    queryKey: ["weather", coords],
    queryFn: () => getWeather({ lat: coords!.lat, lon: coords!.lon }),
    enabled: Boolean(coords),
  });

  if (error) {
    throw error;
  }

  if (!coords || isPending || !data) {
    return <CurrentSkeleton />;
  }

  const localTime = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: data.timezone,
  }).format(new Date(data.current.dt * 1000));

  return (
    <Card title="Current Weather" childrenClassName="flex flex-col gap-4 sm:gap-5 min-h-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-4xl sm:text-5xl font-semibold leading-none">
            {Math.round(data.current.temp)}°C
          </p>
          <p className="capitalize text-lg mt-2">{data.current.weather[0].description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Local time {localTime}
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/30 p-2 sm:p-3 shrink-0">
          <WeatherIcon src={data.current.weather[0].icon} className="size-12 sm:size-14" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
        <MetricTile label="Feels Like" value={`${Math.round(data.current.feels_like)}°C`} />
        <MetricTile label="Humidity" value={`${Math.round(data.current.humidity)}%`} />
        <MetricTile label="Wind" value={`${formatSpeed(data.current.wind_speed)} m/s`} />
        <MetricTile label="Visibility" value={`${Math.round(data.current.visibility / 1000)} km`} />
      </div>
    </Card>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/25 p-2.5 sm:p-3 flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm sm:text-base font-medium">{value}</p>
    </div>
  );
}

function formatSpeed(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}
