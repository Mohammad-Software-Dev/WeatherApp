import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
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
