import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPanel({ darkMode }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: darkMode
        ? "mapbox://styles/mapbox/streets-v12"
        : "mapbox://styles/mapbox/dark-v11",
      center: [74.3587, 31.5204],
      zoom: 12,
    });
  }, [darkMode]);

  return (
    <div className="bg-white dark:bg-[#0f1720] rounded-xl border border-gray-200 dark:border-gray-700">
      <div ref={mapContainer} className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
