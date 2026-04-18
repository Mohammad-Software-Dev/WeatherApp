# WeatherApp Portfolio Report

## 1) Project Overview

**WeatherApp** is a modern, responsive weather dashboard built with **React + TypeScript + Vite**.  
It combines real-time and forecast weather data with an interactive map experience, location search, and user-centric UI behavior (theme-aware map styling, location persistence, and resilient error handling).

The project was built to answer a practical UX problem: most weather apps either overload users with data or hide useful context behind too many interactions. This app focuses on **high-value weather context in one screen** with minimal friction.

---

## 2) Product Goal and Value

### Core Goal
Provide a clear, fast, and reliable weather experience where users can:
- quickly select or discover a location,
- see current conditions and short-horizon decision data,
- understand hourly weather trends in context,
- and interact with weather layers on a live map.

### User Value
- **Fast orientation:** current weather + “Today at a Glance” summarize the most actionable details.
- **Location flexibility:** supports place search, map click selection, and device geolocation.
- **Visual context:** weather overlays + legend help users understand regional conditions.
- **Low-friction reuse:** theme, map layer, and location are persisted across sessions.

---

## 3) Tech Stack

- **Frontend:** React 19, TypeScript
- **Build Tooling:** Vite 7
- **Data Fetching/Caching:** TanStack Query
- **Map Stack:** Leaflet, React-Leaflet, MapTiler layer
- **Styling/UI:** Tailwind CSS 4 + UI primitives
- **Validation:** Zod runtime schemas
- **APIs:**
  - Open-Meteo (forecast + geocoding)
  - OpenWeather (weather overlay tiles)

---

## 4) Architecture and Logic

### 4.1 Data Layer Design
The app centralizes external API logic in `src/api.ts` and validates all mapped responses using Zod schemas.

Key pattern:
1. Fetch provider response.
2. Validate raw shape (Open-Meteo schema guard).
3. Map to internal OpenWeather-like shape expected by UI cards.
4. Validate mapped output using project-level schema (`weatherSchema`).

This strategy prevents silent data-shape breakage and keeps card components simple.

### 4.2 Query Strategy
TanStack Query powers weather/geocode fetching with:
- coordinate-based query keys,
- `enabled` guards to prevent invalid calls,
- cached results and predictable refetching behavior.

### 4.3 Error Isolation
Each major weather section is wrapped in `QueryErrorBoundary` so one failed API section does not crash the full page. Retry is section-scoped.

### 4.4 Location State Model
Location selection uses a normalized state model:
- label
- lat/lon
- source (`search`, `map-click`, `device`)

This enables consistent downstream behavior regardless of input method.

### 4.5 Theme + Map Coupling
Theme context controls both UI colors and map base style:
- dark UI => dark base map
- light UI => light base map

This keeps visual coherence and reduces contrast mismatches.

---

## 5) Main Features

### Location and Selection
- Debounced typeahead location search.
- Keyboard-selectable geocode results.
- “Locate me” via device geolocation permission.
- Map click to set custom pin location.
- Reverse geocode flow to convert device coordinates into human-readable place names.

### Weather Presentation
- Current weather card with key conditions and essential metrics.
- “Today at a Glance” card focused on actionable short-term indicators.
- Hourly forecast grouped by day (`Today`, `Tomorrow`, weekday), timezone-aware.

### Map Experience
- Base map default mode (`None`) with no weather overlay.
- Selectable weather overlays (clouds, rain, pressure, wind, temperature).
- Conditional legend for selected overlays.

### UX and State Persistence
- Persisted theme, location, and map layer via localStorage.
- Mobile/desktop responsive behavior with layout adaptation.
- Skeleton loading states aligned with final card structures.

---

## 6) UI/UX Decisions and Rationale

### Information Hierarchy
The UI is structured around practical decision flow:
1. Choose location/layer quickly.
2. Read current conditions.
3. Scan short-term highlights.
4. Dive into hourly timeline if needed.

### Reduced Cognitive Load
- “Today at a Glance” emphasizes high-signal metrics instead of full raw dumps.
- Day-grouped hourly forecast provides temporal context (not just a flat list of hours).

### Responsive Usability
- Desktop uses dashboard-style side panel and bounded internal scrolling.
- Smaller screens prioritize content stacking and touch-friendly row behavior.

### Accessibility Effort
- Combobox semantics for location search (`combobox`, `listbox`, `option`, active descendant).
- Live status updates for search states (loading/no results/error).
- Theme controls include explicit labels and clear active states.

---

## 7) Engineering Strengths / Advantages

- **Runtime safety:** Zod validation at data boundaries reduces production surprises.
- **Composable architecture:** cards remain focused because transformation and fetching logic are centralized.
- **Resilience:** section-level error boundaries preserve partial functionality.
- **Pragmatic performance:** lazy loading for map-heavy components and query gating reduce unnecessary work.
- **User continuity:** persisted preferences create a “return-ready” experience.

---

## 8) Challenges Solved

1. **Provider mismatch problem**  
   Open-Meteo and OpenWeather data models differ. The app solves this by mapping and validating a stable internal shape.

2. **Map interaction side effects**  
   Refined event and pan behavior to avoid render-side side effects and repeated handlers.

3. **Forecast readability**  
   Replaced undifferentiated 48-hour strips with day-grouped sections and timezone-correct labels.

4. **Desktop overflow issues**  
   Hardened layout containment with `min-h-0` chains and bounded internal scroll regions.

---

## 9) Known Limitations

- API keys are client-exposed (`VITE_*`) and suitable for public tile usage, but not for sensitive secrets.
- Build output still has a large map-vendor chunk; more aggressive splitting is possible.
- Reverse-geocode quality depends on provider granularity in some regions.

---

## 10) Next Steps (Roadmap)

### Near-Term
1. Add optional **“Use my location on load”** setting with graceful denial fallback.
2. Add lightweight **E2E tests** for search, locate-me, and map-layer interactions.
3. Add **manual chunk tuning** to reduce initial JS for non-map interactions.

### Mid-Term
1. Add **daily forecast re-integration** as an optional collapsible panel.
2. Add **units settings** (metric/imperial) with persistence.
3. Improve **geolocation labeling fallback** by blending nearby geocode search when reverse results are sparse.

### Advanced
1. Add a backend proxy for API keys and request policy control.
2. Add observability events (fetch failures, fallback usage, location permission denial rate).

---

## 11) Portfolio Positioning Summary

This project demonstrates:
- strong frontend architecture in a real API-driven application,
- practical TypeScript + runtime validation discipline,
- user-focused UI/UX iteration under real layout constraints,
- map-heavy interaction design with responsive behavior,
- and reliability-focused engineering (error isolation, query gating, persistence).

If presented in a portfolio, this can be framed as a **production-minded dashboard case study**: balancing data richness, clarity, resilience, and performance in a single-page React application.
