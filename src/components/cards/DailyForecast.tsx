import { useQuery } from "@tanstack/react-query";
import Card from "./Card";
import { getWeather } from "../../api";
import WeatherIcon from "../WeatherIcon";
import type { Coords } from "../../types";
import DailySkeleton from "../skeletons/DailySkeleton";
type Props = {
  coords: Coords | null;
};
function DailyForecast({ coords }: Props) {
  const { data, error, isPending } = useQuery({
    queryKey: ["weather", coords],
    queryFn: () => getWeather({ lat: coords!.lat, lon: coords!.lon }),
    enabled: Boolean(coords),
  });

  if (error) {
    throw error;
  }

  if (!coords || isPending || !data) {
    return <DailySkeleton />;
  }

  return (
    <Card
      title={"Daily Forecast"}
      childrenClassName="flex flex-col gap-4 2xl:justify-between"
    >
      {data?.daily.map((day) => (
        <div key={day.dt} className="flex justify-between">
          <p className="w-9">
            {new Date(day.dt * 1000).toLocaleDateString(undefined, {
              weekday: "short",
            })}
          </p>
          <WeatherIcon src={day.weather[0].icon} />

          <p>{Math.round(day.temp.day)}°C</p>
          <p className="text-gray-500/75">{Math.round(day.temp.min)}°C</p>
          <p className="text-gray-500/75">{Math.round(day.temp.max)}°C</p>
        </div>
      ))}
    </Card>
  );
}

export default DailyForecast;
