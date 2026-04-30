import { useQuery } from "@tanstack/react-query";
import Card from "./Card";
import { getWeather } from "../../api";
import type { Coords } from "../../types";
import AdditionalInfoSkeleton from "../skeletons/AdditionalInfoSkeleton";
import WeatherIcon from "../WeatherIcon";

type Props = {
  coords: Coords | null;
};

type HourPoint = {
  dt: number;
  temp: number;
  pop: number;
  feels_like: number;
  humidity: number;
  uvi: number;
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
  const todayHours = getTodayHours(data.current.dt, data.timezone, data.hourly);
  const todayTemps = [data.current.temp, ...todayHours.map((hour) => hour.temp)];
  const todayUvs = [data.current.uvi, ...todayHours.map((hour) => hour.uvi)];
  const rainChance6h = Math.round(Math.max(...next6h.map((hour) => hour.pop)) * 100);
  const tempPeak = Math.max(...todayTemps);
  const tempLow = Math.min(...todayTemps);
  const uvPeak = Math.max(...todayUvs);
  const uvLow = Math.min(...todayUvs);
  const windGustPeak = Number(
    Math.max(data.current.wind_gust ?? 0, ...next24h.map((hour) => hour.wind_gust ?? 0)).toFixed(1)
  );

  const checkpoints = buildCheckpoints(data.current.dt, data.timezone, data.hourly);

  return (
    <Card
      title="Today at a Glance"
      className="h-full"
      childrenClassName="flex flex-col gap-3.5 sm:gap-4 min-h-0"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-2 sm:gap-2.5">
        <div className="xl:col-span-2">
          <RangeChip
            label="Temperature"
            currentValue={`${Math.round(data.current.temp)}°C`}
            minLabel={`${Math.round(tempLow)}°C`}
            maxLabel={`${Math.round(tempPeak)}°C`}
            current={data.current.temp}
            min={tempLow}
            max={tempPeak}
            tone={tempTone(data.current.temp)}
            trackClass="bg-gradient-to-r from-cyan-400/70 via-emerald-400/70 to-orange-400/80"
          />
        </div>
        <div className="xl:col-span-2">
          <RangeChip
            label="UV Index"
            currentValue={formatUv(data.current.uvi)}
            minLabel={formatUv(uvLow)}
            maxLabel={formatUv(uvPeak)}
            current={data.current.uvi}
            min={uvLow}
            max={uvPeak}
            tone={uvTone(data.current.uvi)}
            trackClass="bg-gradient-to-r from-emerald-400/70 via-amber-400/80 to-red-500/80"
          />
        </div>
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
            <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:grid-cols-4">
              <CheckpointMetric label="Rain" value={`${Math.round(hour.pop * 100)}%`} />
              <CheckpointMetric
                label="Feels"
                value={`${Math.round(hour.feels_like)}°C`}
              />
              <CheckpointMetric label="UV" value={formatUv(hour.uvi)} />
              <CheckpointMetric label="Humidity" value={`${Math.round(hour.humidity)}%`} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function buildCheckpoints(currentDt: number, timezone: string, hours: HourPoint[]) {
  const checkpointHours = hours
    .filter((hour) => hour.dt > currentDt && isThreeHourBoundary(hour.dt, timezone))
    .slice(0, 3);

  const fallbackHours = hours
    .filter((hour) => hour.dt > currentDt)
    .slice(0, 3 - checkpointHours.length);

  return [...checkpointHours, ...fallbackHours].map((hour) => ({
    label: formatShortHour(hour.dt, timezone),
    hour,
  }));
}

function getTodayHours(currentDt: number, timezone: string, hours: HourPoint[]) {
  const todayKey = formatDateKey(currentDt, timezone);
  return hours.filter((hour) => formatDateKey(hour.dt, timezone) === todayKey);
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

function formatUv(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatDateKey(unixSeconds: number, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

function isThreeHourBoundary(unixSeconds: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date(unixSeconds * 1000));

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return minute === 0 && hour % 3 === 0;
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
    <div className={`rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col justify-between min-w-0 min-h-22 sm:min-h-24 ${toneClass}`}>
      <p className="text-[11px] sm:text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="text-2xl sm:text-3xl font-semibold leading-none break-words">{value}</p>
    </div>
  );
}

function RangeChip({
  label,
  currentValue,
  minLabel,
  maxLabel,
  current,
  min,
  max,
  tone,
  trackClass,
}: {
  label: string;
  currentValue: string;
  minLabel: string;
  maxLabel: string;
  current: number;
  min: number;
  max: number;
  tone: Tone;
  trackClass: string;
}) {
  const toneClass =
    tone === "good"
      ? "border-green-500/45 bg-gradient-to-br from-green-500/20 to-green-500/5"
      : tone === "warn"
      ? "border-amber-500/45 bg-gradient-to-br from-amber-500/20 to-amber-500/5"
      : tone === "risk"
      ? "border-red-500/45 bg-gradient-to-br from-red-500/20 to-red-500/5"
      : "border-border/70 bg-background/20";

  const position = getRangePosition(current, min, max);

  return (
    <div className={`rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col gap-3 min-w-0 min-h-22 sm:min-h-24 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-semibold leading-none">
            {currentValue}
          </p>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground shrink-0">
          {minLabel} to {maxLabel}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative h-2.5 rounded-full bg-white/8 overflow-hidden">
          <div className={`absolute inset-0 ${trackClass}`} />
          <div
            className="absolute inset-y-0 left-0 bg-white/14"
            style={{ width: `${position}%` }}
          />
          <div
            className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-background bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
            style={{ left: `calc(${position}% - 0.5rem)` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
          <span>Low {minLabel}</span>
          <span>Peak {maxLabel}</span>
        </div>
      </div>
    </div>
  );
}

function getRangePosition(current: number, min: number, max: number) {
  if (max <= min) {
    return 50;
  }

  const raw = ((current - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, raw));
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
