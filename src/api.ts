// src/lib/getWeather.ts
import { z } from "zod";
import { weatherSchema } from "./schemas/weatherSchema";
import { GeocodeSchema } from "./schemas/geocodeSchema";

/* ========================================================================
   TYPES (inferred from your existing schemas)
======================================================================== */

export type Weather = z.infer<typeof weatherSchema>;
export type Geocode = z.infer<typeof GeocodeSchema>;

/* ========================================================================
   OPEN-METEO: RESPONSE VALIDATORS (only the fields we read)
======================================================================== */

const openMeteoWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  utc_offset_seconds: z.number(),
  current: z
    .object({
      time: z.number(),
      temperature_2m: z.number().optional(),
      apparent_temperature: z.number().optional(),
      relative_humidity_2m: z.number().optional(),
      dew_point_2m: z.number().optional(),
      surface_pressure: z.number().optional(),
      pressure_msl: z.number().optional(),
      precipitation: z.number().optional(),
      rain: z.number().optional(),
      showers: z.number().optional(),
      snowfall: z.number().optional(),
      cloud_cover: z.number().optional(),
      visibility: z.number().optional(),
      wind_speed_10m: z.number().optional(),
      wind_gusts_10m: z.number().optional(),
      wind_direction_10m: z.number().optional(),
      weather_code: z.number().optional(),
      uv_index: z.number().optional(),
    })
    .nullable()
    .optional(),
  hourly: z
    .object({
      time: z.array(z.number()),
      temperature_2m: z.array(z.number()).optional(),
      apparent_temperature: z.array(z.number()).optional(),
      relative_humidity_2m: z.array(z.number()).optional(),
      dew_point_2m: z.array(z.number()).optional(),
      surface_pressure: z.array(z.number()).optional(),
      pressure_msl: z.array(z.number()).optional(),
      precipitation: z.array(z.number()).optional(),
      rain: z.array(z.number()).optional(),
      showers: z.array(z.number()).optional(),
      snowfall: z.array(z.number()).optional(),
      cloud_cover: z.array(z.number()).optional(),
      visibility: z.array(z.number()).optional(),
      wind_speed_10m: z.array(z.number()).optional(),
      wind_gusts_10m: z.array(z.number()).optional(),
      wind_direction_10m: z.array(z.number()).optional(),
      uv_index: z.array(z.number()).optional(),
      precipitation_probability: z.array(z.number()).optional(),
      weather_code: z.array(z.number()).optional(),
    })
    .nullable()
    .optional(),
  daily: z
    .object({
      time: z.array(z.number()),
      sunrise: z.array(z.number()).optional(),
      sunset: z.array(z.number()).optional(),
      temperature_2m_max: z.array(z.number()).optional(),
      temperature_2m_min: z.array(z.number()).optional(),
      uv_index_max: z.array(z.number()).optional(),
      uv_index_clear_sky_max: z.array(z.number()).optional(),
      precipitation_sum: z.array(z.number()).optional(),
      rain_sum: z.array(z.number()).optional(),
      showers_sum: z.array(z.number()).optional(),
      snowfall_sum: z.array(z.number()).optional(),
      wind_speed_10m_max: z.array(z.number()).optional(),
      wind_gusts_10m_max: z.array(z.number()).optional(),
      wind_speed_10m_mean: z.array(z.number()).optional(),
      wind_direction_10m_dominant: z.array(z.number()).optional(),
      cloud_cover_mean: z.array(z.number()).optional(),
      pressure_msl_mean: z.array(z.number()).optional(),
      relative_humidity_2m_mean: z.array(z.number()).optional(),
      dew_point_2m_mean: z.array(z.number()).optional(),
      precipitation_probability_max: z.array(z.number()).optional(),
      weather_code: z.array(z.number()).optional(),
    })
    .nullable()
    .optional(),
});

const openMeteoGeocodeSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        elevation: z.number().optional(),
        feature_code: z.string().optional(),
        country_code: z.string().optional(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        admin2: z.string().optional(),
        admin3: z.string().optional(),
        admin4: z.string().optional(),
        timezone: z.string().optional(),
        population: z.number().optional(),
        postcodes: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

/* ========================================================================
   OPEN-METEO: VARIABLE LISTS (to match your OpenWeather-like schema)
======================================================================== */

const CURRENT_PARAMS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "dew_point_2m",
  "surface_pressure",
  "pressure_msl",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "cloud_cover",
  "visibility",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "weather_code",
  "uv_index",
] as const;

const HOURLY_PARAMS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "dew_point_2m",
  "surface_pressure",
  "pressure_msl",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "cloud_cover",
  "visibility",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "uv_index",
  "precipitation_probability",
  "weather_code",
] as const;

const DAILY_PARAMS = [
  "sunrise",
  "sunset",
  "temperature_2m_max",
  "temperature_2m_min",
  "uv_index_max",
  "uv_index_clear_sky_max",
  "precipitation_sum",
  "rain_sum",
  "showers_sum",
  "snowfall_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_speed_10m_mean",
  "wind_direction_10m_dominant",
  "cloud_cover_mean",
  "pressure_msl_mean",
  "relative_humidity_2m_mean",
  "dew_point_2m_mean",
  "precipitation_probability_max",
  "weather_code",
] as const;

/* ========================================================================
   HELPERS
======================================================================== */

function mapWeatherCodeToWeatherArray(code: number) {
  if (code === 0) {
    return [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }];
  }
  if (code >= 1 && code <= 3) {
    return [
      { id: 801, main: "Clouds", description: "partly cloudy", icon: "02d" },
    ];
  }
  if (code >= 45 && code <= 48) {
    return [{ id: 741, main: "Fog", description: "fog", icon: "50d" }];
  }
  if (code >= 51 && code <= 67) {
    return [{ id: 500, main: "Drizzle", description: "drizzle", icon: "09d" }];
  }
  if (code >= 71 && code <= 77) {
    return [{ id: 600, main: "Snow", description: "snow", icon: "13d" }];
  }
  if (code >= 80 && code <= 82) {
    return [
      { id: 501, main: "Rain", description: "rain showers", icon: "10d" },
    ];
  }
  if (code >= 95 && code <= 99) {
    return [
      {
        id: 200,
        main: "Thunderstorm",
        description: "thunderstorm",
        icon: "11d",
      },
    ];
  }
  return [
    {
      id: code,
      main: "Unknown",
      description: `Open-Meteo weather code ${code}`,
      icon: "01d",
    },
  ];
}

/* ========================================================================
   WEATHER: Fetch Open-Meteo -> Map -> Validate against your Weather schema
======================================================================== */

export async function getWeather({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}): Promise<Weather> {
  const baseUrl = "https://api.open-meteo.com/v1/forecast";

  const url =
    `${baseUrl}?latitude=${lat}` +
    `&longitude=${lon}` +
    `&timezone=auto` +
    `&timeformat=unixtime` +
    `&temperature_unit=celsius` + // align with OpenWeather metric temps
    `&wind_speed_unit=ms` + // OpenWeather uses m/s
    `&precipitation_unit=mm` + // OpenWeather uses mm
    `&current=${CURRENT_PARAMS.join(",")}` +
    `&hourly=${HOURLY_PARAMS.join(",")}` +
    `&daily=${DAILY_PARAMS.join(",")}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch weather: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const data = openMeteoWeatherSchema.parse(json);

  const {
    latitude,
    longitude,
    timezone,
    utc_offset_seconds,
    current,
    hourly,
    daily,
  } = data;

  const tzOffset = utc_offset_seconds ?? 0;

  // CURRENT
  const currentDt = current?.time ?? Math.floor(Date.now() / 1000);
  const currentWeatherCode = current?.weather_code ?? 0;

  const currentMapped = {
    dt: currentDt,
    sunrise: daily?.sunrise?.[0] ?? currentDt,
    sunset: daily?.sunset?.[0] ?? currentDt,
    temp: current?.temperature_2m ?? 0,
    feels_like: current?.apparent_temperature ?? current?.temperature_2m ?? 0,
    pressure:
      current?.pressure_msl ??
      current?.surface_pressure ??
      daily?.pressure_msl_mean?.[0] ??
      0,
    humidity: current?.relative_humidity_2m ?? 0,
    dew_point: current?.dew_point_2m ?? 0,
    uvi: current?.uv_index ?? 0,
    clouds: current?.cloud_cover ?? 0,
    visibility: current?.visibility ?? 0,
    wind_speed: current?.wind_speed_10m ?? 0,
    wind_deg: current?.wind_direction_10m ?? 0,
    wind_gust: current?.wind_gusts_10m,
    weather: mapWeatherCodeToWeatherArray(currentWeatherCode),
  };

  // HOURLY
  const hourlyLength = hourly?.time?.length ?? 0;
  const hourlyMapped =
    hourlyLength === 0 || !hourly
      ? []
      : Array.from({ length: hourlyLength }, (_, i) => {
          const code = hourly.weather_code?.[i] ?? 0;

          return {
            dt: hourly.time[i],
            temp: hourly.temperature_2m?.[i] ?? 0,
            feels_like:
              hourly.apparent_temperature?.[i] ??
              hourly.temperature_2m?.[i] ??
              0,
            pressure:
              hourly.pressure_msl?.[i] ?? hourly.surface_pressure?.[i] ?? 0,
            humidity: hourly.relative_humidity_2m?.[i] ?? 0,
            dew_point: hourly.dew_point_2m?.[i] ?? 0,
            uvi: hourly.uv_index?.[i] ?? 0,
            clouds: hourly.cloud_cover?.[i] ?? 0,
            visibility: hourly.visibility?.[i] ?? 0,
            wind_speed: hourly.wind_speed_10m?.[i] ?? 0,
            wind_deg: hourly.wind_direction_10m?.[i] ?? 0,
            wind_gust: hourly.wind_gusts_10m?.[i] ?? 0,
            pop: (hourly.precipitation_probability?.[i] ?? 0) / 100,
            weather: mapWeatherCodeToWeatherArray(code),
          };
        });

  // DAILY
  const dailyLength = daily?.time?.length ?? 0;
  const dailyMapped =
    dailyLength === 0 || !daily
      ? []
      : Array.from({ length: dailyLength }, (_, i) => {
          const code = daily.weather_code?.[i] ?? 0;

          const tMin = daily.temperature_2m_min?.[i] ?? 0;
          const tMax = daily.temperature_2m_max?.[i] ?? tMin;
          const tMean = (tMin + tMax) / 2;

          return {
            dt: daily.time[i],
            sunrise: daily.sunrise?.[i] ?? daily.time[i],
            sunset: daily.sunset?.[i] ?? daily.time[i],

            // Not provided by Open-Meteo – placeholders; make optional in schema if desired
            moonrise: daily.time[i],
            moonset: daily.time[i],
            moon_phase: 0,
            summary: "",

            temp: {
              day: tMean,
              min: tMin,
              max: tMax,
              night: tMin,
              eve: tMin,
              morn: tMin,
            },
            feels_like: {
              day: tMean,
              night: tMin,
              eve: tMin,
              morn: tMin,
            },

            pressure: daily.pressure_msl_mean?.[i] ?? 0,
            humidity: daily.relative_humidity_2m_mean?.[i] ?? 0,
            dew_point: daily.dew_point_2m_mean?.[i] ?? 0,
            wind_speed: daily.wind_speed_10m_mean?.[i] ?? 0,
            wind_deg: daily.wind_direction_10m_dominant?.[i] ?? 0,
            wind_gust:
              daily.wind_speed_10m_max?.[i] ??
              daily.wind_gusts_10m_max?.[i] ??
              0,
            weather: mapWeatherCodeToWeatherArray(code),
            clouds: daily.cloud_cover_mean?.[i] ?? 0,
            pop: (daily.precipitation_probability_max?.[i] ?? 0) / 100,
            rain:
              daily.rain_sum?.[i] ?? daily.precipitation_sum?.[i] ?? undefined,
            uvi: daily.uv_index_max?.[i] ?? 0,
          };
        });

  // FINAL: validate against your OpenWeather-like schema and return
  return weatherSchema.parse({
    lat: latitude,
    lon: longitude,
    timezone,
    timezone_offset: tzOffset,
    current: currentMapped,
    hourly: hourlyMapped,
    daily: dailyMapped,
  });
}

/* ========================================================================
   GEOCODE: Fetch Open-Meteo -> Map -> Validate against your Geocode schema
======================================================================== */

type GetGeocodeOptions = {
  /** Number of results to return (Open-Meteo `count` param). */
  count?: number;
  /** Language (Open-Meteo `language` param). */
  language?: string;
};

export async function getGeocode(
  location: string,
  { count = 1, language = "en" }: GetGeocodeOptions = {}
): Promise<Geocode> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(location)}` +
    `&count=${count}` +
    `&language=${encodeURIComponent(language)}` +
    `&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocode fetch failed: ${res.status} ${res.statusText}`);
  }

  const raw = await res.json();
  const parsed = openMeteoGeocodeSchema.parse(raw);
  const results = parsed.results ?? [];

  const openWeatherLike = results.map((r) => ({
    name: r.name,
    // OpenWeather expects a record of localized names; Open-Meteo returns one localized name.
    local_names: { [language]: r.name } as Record<string, string>,
    lat: r.latitude,
    lon: r.longitude,
    // Prefer full country name; fallback to ISO code.
    country: r.country ?? r.country_code ?? "",
    // OpenWeather "state" ≈ admin1
    state: r.admin1 || undefined,
  }));

  return GeocodeSchema.parse(openWeatherLike);
}
