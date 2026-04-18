# WeatherApp

Weather dashboard built with React + TypeScript + Vite.  
It combines Open-Meteo forecast/geocoding data with OpenWeather map overlays.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- TanStack Query
- Leaflet + React Leaflet + MapTiler layer
- Tailwind CSS 4
- Zod runtime validation

## Requirements

- Node.js 20+ (recommended)
- npm 10+ or pnpm

## Environment Variables

Create `.env.local` with:

```bash
OPENWEATHER_API_KEY=your_openweather_api_key
```

Notes:
- `OPENWEATHER_API_KEY` is used only on the server-side tile proxy route (`/api/openweather/map/...`).
- No weather API key is exposed to the browser.

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: type-check and produce production build
- `npm run lint`: run ESLint
- `npm run preview`: preview production build locally

## Architecture Notes

- `src/api.ts` contains provider calls and maps Open-Meteo responses into an OpenWeather-like shape.
- `src/schemas/*` validates all remote responses or mapped payloads via Zod.
- Weather cards and side panel fetch via TanStack Query with `enabled` guards to avoid invalid coordinate requests.
- UI sections are wrapped in retryable error boundaries so failed API requests do not crash the entire page.
- Map and side panel are lazy-loaded to reduce the initial JS payload.
- Client preferences are persisted in `localStorage` (theme, map type, and last preset location).
- Location selection uses Open-Meteo geocoding search (debounced typeahead) and stores exact selected coordinates.
- Map overlay defaults to `None` so the initial map is a clean base map without weather overlay tiles.
- OpenWeather tile requests are routed through a server-side proxy endpoint to keep API keys private.

## Known Limitations

- If deploying as static files only (without serverless/API routes), the OpenWeather proxy endpoint will not be available.
- Daily fields that Open-Meteo does not provide (`moonrise`, `moonset`, `moon_phase`, `summary`) are currently mapped to placeholders to satisfy existing schema shape.
- Production build currently emits a large chunk warning and would benefit from additional route/component-level splitting.
