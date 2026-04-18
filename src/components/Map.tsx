import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Coords, MapType } from "../types";
import { useEffect } from "react";
import { useTheme } from "./theme-context";

type Props = {
  coords: Coords;
  onMapClick: (lat: number, lon: number) => void;
  mapType: MapType;
};
export default function Map({ coords, onMapClick, mapType }: Props) {
  const { lat, lon } = coords;
  const shouldRenderOverlay = mapType !== "none";
  const { theme } = useTheme();
  const baseMapUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={5}
      style={{ width: "100%", height: "100%" }}
    >
      <MapClick onMapClick={onMapClick} coords={coords} />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url={baseMapUrl}
      />
      {shouldRenderOverlay && (
        <TileLayer
          opacity={0.7}
          url={`/api/openweather/map/${mapType}/{z}/{x}/{y}.png`}
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
