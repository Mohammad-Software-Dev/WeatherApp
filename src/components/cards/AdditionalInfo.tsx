import { useQuery } from "@tanstack/react-query";
import Card from "./Card";
import { getWeather } from "../../api";
import type { Coords } from "../../types";
import AdditionalInfoSkeleton from "../skeletons/AdditionalInfoSkeleton";
import WeatherIcon from "../WeatherIcon";

type Props = {
  coords: Coords | null;
};

type Checkpoint = "Now" | string;
type HourPoint = {
  dt: number;
  temp: number;
  pop: number;
  feels_like: number;
  humidity: number;
  weather: { icon: string; description: string }[];
};

export default function AdditionalInfo({ coords }: Props) {
  const { data, error, isPending } = useQuery({
    queryKey: ["weather", coords],
    queryFn: () => getWeather({ lat: coords!.lat, lon: coords!.lon }),
    enabled: Boolean(coords),
  });

  if (error) {
    throw error;
  }

  if (!coords || isPending || !data) {
    return <AdditionalInfoSkeleton />;
  }

  const next6h = data.hourly.slice(0, 6);
  const next24h = data.hourly.slice(0, 24);
  const rainChance6h = Math.round(Math.max(...next6h.map((hour) => hour.pop)) * 100);
  const uvPeak = Number(
    Math.max(data.current.uvi, data.daily[0]?.uvi ?? 0, ...next24h.map((h) => h.uvi)).toFixed(1)
  );
  const windGustPeak = Number(
    Math.max(data.current.wind_gust ?? 0, ...next24h.map((hour) => hour.wind_gust ?? 0)).toFixed(1)
  );

  const checkpoints = buildCheckpoints(data.timezone, data.hourly);

  return (
    <Card
      title="Today at a Glance"
      childrenClassName="flex flex-col gap-3.5 sm:gap-4 min-h-0"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
        <StatChip
          label="Feels Like"
          value={`${Math.round(data.current.feels_like)}°C`}
          tone={tempTone(data.current.feels_like)}
        />
        <StatChip
          label="Rain (6h)"
          value={`${rainChance6h}%`}
          tone={percentageTone(rainChance6h)}
        />
        <StatChip
          label="UV Peak"
          value={uvPeak.toString()}
          tone={uvTone(uvPeak)}
        />
        <StatChip
          label="Wind Gust"
          value={`${windGustPeak} m/s`}
          tone={windTone(windGustPeak)}
        />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Sunrise {formatTime(data.current.sunrise, data.timezone)} · Sunset{" "}
        {formatTime(data.current.sunset, data.timezone)}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
        {checkpoints.map(({ label, hour }) => (
          <div
            key={label}
            className="rounded-xl border border-border/70 bg-background/15 p-3 sm:p-3.5 flex flex-col gap-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-lg font-semibold uppercase tracking-wide leading-none">{label}</p>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <WeatherIcon src={hour.weather[0].icon} className="size-6 shrink-0" />
                <span className="text-sm sm:text-base line-clamp-1 capitalize">
                  {hour.weather[0].description}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-semibold shrink-0 leading-none">
                {Math.round(hour.temp)}°C
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
              <CheckpointMetric label="Rain" value={`${Math.round(hour.pop * 100)}%`} />
              <CheckpointMetric
                label="Feels"
                value={`${Math.round(hour.feels_like)}°C`}
              />
              <CheckpointMetric label="Humidity" value={`${Math.round(hour.humidity)}%`} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function buildCheckpoints(timezone: string, hours: HourPoint[]) {
  const now = hours[0];
  const afternoon = pickClosestHour(hours, timezone, 15);
  const tonight = pickClosestHour(hours, timezone, 21);

  return [
    { label: "Now" as Checkpoint, hour: now },
    { label: formatShortHour(afternoon.dt, timezone), hour: afternoon },
    { label: formatShortHour(tonight.dt, timezone), hour: tonight },
  ];
}

function pickClosestHour(hours: HourPoint[], timezone: string, targetHour: number) {
  const getHour = (unixSeconds: number) =>
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).format(new Date(unixSeconds * 1000))
    );

  return (
    hours.find((hour) => getHour(hour.dt) >= targetHour) ??
    hours[hours.length - 1]
  );
}

function formatTime(unixSeconds: number, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(unixSeconds * 1000));
}

function formatShortHour(unixSeconds: number, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: true,
  }).format(new Date(unixSeconds * 1000));
}

type Tone = "good" | "warn" | "risk" | "neutral";

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const toneClass =
    tone === "good"
      ? "border-green-500/45 bg-gradient-to-br from-green-500/20 to-green-500/5"
      : tone === "warn"
      ? "border-amber-500/45 bg-gradient-to-br from-amber-500/20 to-amber-500/5"
      : tone === "risk"
      ? "border-red-500/45 bg-gradient-to-br from-red-500/20 to-red-500/5"
      : "border-border/70 bg-background/20";

  return (
    <div className={`rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col justify-between min-h-24 sm:min-h-26 min-w-0 ${toneClass}`}>
      <p className="text-[11px] sm:text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold leading-none break-words">{value}</p>
    </div>
  );
}

function tempTone(value: number): Tone {
  if (value < 0 || value > 32) return "risk";
  if (value < 8 || value > 28) return "warn";
  return "good";
}

function percentageTone(value: number): Tone {
  if (value >= 70) return "risk";
  if (value >= 35) return "warn";
  return "good";
}

function uvTone(value: number): Tone {
  if (value >= 8) return "risk";
  if (value >= 4) return "warn";
  return "good";
}

function windTone(value: number): Tone {
  if (value >= 14) return "risk";
  if (value >= 8) return "warn";
  return "good";
}

function CheckpointMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm sm:text-base font-medium leading-tight break-words">{value}</p>
    </div>
  );
}
