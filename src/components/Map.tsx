import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coords, MapType } from "../types";
import { useEffect } from "react";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import { useTheme } from "./theme-context";

const API_KEY = import.meta.env.VITE_API_KEY;
const MAPTILE_API_KEY = import.meta.env.VITE_MAPTILE_API_KEY;
type Props = {
  coords: Coords;
  onMapClick: (lat: number, lon: number) => void;
  mapType: MapType;
};
export default function Map({ coords, onMapClick, mapType }: Props) {
  const { lat, lon } = coords;
  const shouldRenderOverlay = mapType !== "none";
  const { theme } = useTheme();
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={5}
      style={{ width: "100%", height: "100%" }}
    >
      <MapClick onMapClick={onMapClick} coords={coords} />
      <MapTileLayer theme={theme} />
      {/* <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      /> */}
      {shouldRenderOverlay && (
        <TileLayer
          opacity={0.7}
          url={`https://tile.openweathermap.org/map/${mapType}/{z}/{x}/{y}.png?appid=${API_KEY}`}
        />
      )}
      <Marker position={[lat, lon]}></Marker>
    </MapContainer>
  );
}

function MapClick({
  onMapClick,
  coords,
}: {
  onMapClick: (lat: number, lon: number) => void;
  coords: Coords;
}) {
  const map = useMap();
  useEffect(() => {
    map.panTo([coords.lat, coords.lon]);
  }, [coords.lat, coords.lon, map]);

  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });

  return null;
}

function MapTileLayer({ theme }: { theme: "light" | "dark" }) {
  const map = useMap();
  useEffect(() => {
    const tileLayer = new MaptilerLayer({
      style: theme === "dark" ? "basic-dark" : "basic",
      apiKey: MAPTILE_API_KEY,
    });
    tileLayer.addTo(map);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map, theme]);
  return null;
}
