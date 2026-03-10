import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYW5vdXNoYXl6ZWFnaHVtIiwiYSI6ImNtYzhvbzRkZjFjNnIyaXNhdGhhdHZ3ZWgifQ.7VC6uTyowkC63sNdfWLe5w";

export default function useMapbox(mapRef) {
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [73.0479, 33.6844],
      zoom: 7,
    });

    map.addControl(new mapboxgl.NavigationControl());

    return () => map.remove();
  }, [mapRef]);
}
