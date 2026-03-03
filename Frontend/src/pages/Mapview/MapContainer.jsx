import { useRef, useEffect } from "react";
import useMapbox from "./hooks/useMapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapContainer() {
  const mapRef = useRef(null);

  useMapbox(mapRef);

  return <div ref={mapRef} className="map-container" />;
}
