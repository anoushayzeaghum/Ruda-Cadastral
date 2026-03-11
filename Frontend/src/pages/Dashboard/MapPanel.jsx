import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPanel() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [74.3587, 31.5204], // Lahore
      zoom: 8,
    });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Live Map Preview</h3>
      <div ref={mapContainer} className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
