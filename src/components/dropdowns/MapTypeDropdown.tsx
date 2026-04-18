import type { Dispatch, SetStateAction } from "react";
import { isMapType, MAP_TYPES, type MapType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  mapType: MapType;
  setMapType: Dispatch<SetStateAction<MapType>>;
};

const LABELS: Record<MapType, string> = {
  none: "None",
  clouds_new: "Clouds",
  precipitation_new: "Rain",
  pressure_new: "Pressure",
  wind_new: "Wind",
  temp_new: "Temperature",
};

export default function MapTypeDropdown({ mapType, setMapType }: Props) {
  return (
    <Select
      value={mapType}
      onValueChange={(value) => {
        if (isMapType(value)) {
          setMapType(value);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Layer" />
      </SelectTrigger>
      <SelectContent className="z-1001">
        {MAP_TYPES.map((type) => (
          <SelectItem key={type} value={type} className="capitalize">
            {LABELS[type]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
