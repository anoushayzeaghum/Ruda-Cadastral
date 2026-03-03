import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "YOUR_MAPBOX_ACCESpk.eyJ1IjoiYW5vdXNoYXl6ZWFnaHVtIiwiYSI6ImNtYzhvbzRkZjFjNnIyaXNhdGhhdHZ3ZWgifQ.7VC6uTyowkC63sNdfWLe5wS_TOKEN";

export default function useMapbox(mapRef) {
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [73.0479, 33.6844],
      zoom: 6,
    });

    map.addControl(new mapboxgl.NavigationControl());

    return () => map.remove();
  }, [mapRef]);
}
