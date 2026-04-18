import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr(), openWeatherTileProxyPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet")) return "vendor-map";
          if (id.includes("node_modules/react-leaflet")) return "vendor-map";
          if (id.includes("node_modules/@maptiler")) return "vendor-map";
          if (id.includes("node_modules/@maplibre")) return "vendor-map";
          if (id.includes("node_modules/@tanstack/react-query"))
            return "vendor-query";
          if (id.includes("node_modules/@radix-ui")) return "vendor-ui";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

function openWeatherTileProxyPlugin() {
  return {
    name: "openweather-tile-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const match = req.url.match(
          /^\/api\/openweather\/map\/([^/]+)\/(\d+)\/(\d+)\/(\d+)\.png$/
        );
        if (!match) {
          next();
          return;
        }

        const [, layer, z, x, y] = match;
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "OPENWEATHER_API_KEY is missing on the server.",
            })
          );
          return;
        }

        const allowedLayers = new Set([
          "clouds_new",
          "precipitation_new",
          "pressure_new",
          "wind_new",
          "temp_new",
        ]);
        if (!allowedLayers.has(layer)) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid layer" }));
          return;
        }

        try {
          const upstream = await fetch(
            `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`
          );
          res.statusCode = upstream.status;
          res.setHeader(
            "Content-Type",
            upstream.headers.get("content-type") ?? "image/png"
          );
          const cacheControl = upstream.headers.get("cache-control");
          if (cacheControl) {
            res.setHeader("Cache-Control", cacheControl);
          }
          const body = await upstream.arrayBuffer();
          res.end(Buffer.from(body));
        } catch {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Failed to fetch weather tile" }));
        }
      });
    },
  };
}
