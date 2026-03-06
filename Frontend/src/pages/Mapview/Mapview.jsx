import { useRef } from "react";
import useMapbox from "../../hooks/useMapbox";

export default function MapView() {
  const mapRef = useRef(null);

  useMapbox(mapRef);

  return (
    <div className="flex-1">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
