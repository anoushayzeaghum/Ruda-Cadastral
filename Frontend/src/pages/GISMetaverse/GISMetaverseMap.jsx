// GISMetaverseMap.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function GISMetaverseMap({ mapRef, setIsMapReady }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 12,
    });

    mapRef.current.on('load', () => {
      setIsMapReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [mapRef]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}