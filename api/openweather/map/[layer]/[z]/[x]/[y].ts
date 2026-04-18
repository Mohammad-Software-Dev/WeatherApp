const ALLOWED_LAYERS = new Set([
  "clouds_new",
  "precipitation_new",
  "pressure_new",
  "wind_new",
  "temp_new",
]);

export default async function handler(
  req: {
    query: {
      layer?: string;
      z?: string;
      x?: string;
      y?: string;
    };
  },
  res: {
    status: (code: number) => { json: (body: unknown) => void; end: (body?: unknown) => void };
    setHeader: (name: string, value: string) => void;
  }
) {
  const apiKey =
    process.env.OPENWEATHER_API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENWEATHER_API_KEY is missing on the server." });
    return;
  }

  const layer = req.query.layer;
  const z = req.query.z;
  const x = req.query.x;
  const yRaw = req.query.y;
  const y = yRaw?.replace(/\.png$/i, "");

  const isNumberSegment = (value: string | undefined) =>
    Boolean(value) && /^\d+$/.test(value);

  if (
    !layer ||
    !isNumberSegment(z) ||
    !isNumberSegment(x) ||
    !isNumberSegment(y) ||
    !ALLOWED_LAYERS.has(layer)
  ) {
    res.status(400).json({ error: "Invalid tile request" });
    return;
  }

  try {
    const upstream = await fetch(
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`
    );

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ?? "image/png"
    );
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    const body = await upstream.arrayBuffer();
    res.status(upstream.status).end(Buffer.from(body));
  } catch {
    res.status(502).json({ error: "Failed to fetch weather tile" });
  }
}
