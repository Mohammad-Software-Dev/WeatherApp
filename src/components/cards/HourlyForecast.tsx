import { useQuery } from "@tanstack/react-query";
import { getWeather } from "../../api";
import Card from "./Card";
import WeatherIcon from "../WeatherIcon";
import type { Coords } from "../../types";
import HourlySkeleton from "../skeletons/HourlySkeleton";

type Props = {
  coords: Coords | null;
};

type HourlyEntry = {
  dt: number;
  temp: number;
  weather: { icon: string }[];
};

type DayGroup = {
  key: string;
  label: string;
  hours: HourlyEntry[];
};

export default function HourlyForecast({ coords }: Props) {
  const { data, error, isPending } = useQuery({
    queryKey: ["weather", coords],
    queryFn: () => getWeather({ lat: coords!.lat, lon: coords!.lon }),
    enabled: Boolean(coords),
  });

  if (error) {
    throw error;
  }

  if (!coords || isPending || !data) {
    return <HourlySkeleton />;
  }

  const dayGroups = groupHoursByDay(data.hourly, data.timezone);

  return (
    <Card
      title="Hourly Forecast"
      className="lg:max-h-[calc(100vh-2.5rem)]"
      childrenClassName="flex flex-col gap-5 min-h-0 lg:overflow-y-auto lg:pr-1"
    >
      {dayGroups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="border-b border-border/70 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-muted/80 text-muted-foreground px-2 py-1 rounded-md">
              {group.label}
            </span>
          </div>
          <div className="flex gap-2 xs:gap-3 md:gap-4 overflow-x-auto pb-2 pr-1">
            {group.hours.map((hour) => (
              <div
                key={hour.dt}
                className="flex flex-col gap-2 items-center p-1.5 xs:p-2 min-w-14 xs:min-w-16 rounded-lg border border-transparent hover:border-border/70 hover:bg-background/20 transition-colors"
              >
                <p className="whitespace-nowrap text-xs xs:text-sm text-muted-foreground">
                  {formatHour(hour.dt, data.timezone)}
                </p>
                <WeatherIcon className="2xl:size-10" src={hour.weather[0].icon} />
                <p className="text-sm xs:text-base font-medium">{Math.round(hour.temp)}°C</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </Card>
  );
}

function groupHoursByDay(hours: HourlyEntry[], timezone: string): DayGroup[] {
  const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: "short",
  });

  const groups: DayGroup[] = [];
  const dayIndexByKey = new Map<string, number>();

  for (const hour of hours) {
    const date = new Date(hour.dt * 1000);
    const dayKey = dayKeyFormatter.format(date);

    if (!dayIndexByKey.has(dayKey)) {
      dayIndexByKey.set(dayKey, groups.length);
      const dayNumber = groups.length;
      groups.push({
        key: dayKey,
        label:
          dayNumber === 0
            ? "Today"
            : dayNumber === 1
            ? "Tomorrow"
            : weekdayFormatter.format(date),
        hours: [],
      });
    }

    groups[dayIndexByKey.get(dayKey)!].hours.push(hour);
  }

  return groups;
}

function formatHour(unixSeconds: number, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(unixSeconds * 1000));
}
