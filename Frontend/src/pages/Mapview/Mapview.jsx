import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { getKhasras } from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ mouzaId }) {

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [74.3587, 31.5204], // Lahore Division
      zoom: 8
    });
    mapInstance.current = map;

    map.on("load", () => {
      map.resize();
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {

    if (!mouzaId || !mapInstance.current) return;

    getKhasras(mouzaId).then((geojson) => {

      const map = mapInstance.current;

      if (map.getSource("khasra")) {
        map.removeLayer("khasra-fill");
        map.removeLayer("khasra-outline");
        map.removeSource("khasra");
      }

      map.addSource("khasra", {
        type: "geojson",
        data: geojson
      });

      map.addLayer({
        id: "khasra-fill",
        type: "fill",
        source: "khasra",
        paint: {
          "fill-color": "#6FC04F",
          "fill-opacity": 0.4
        }
      });

      map.addLayer({
        id: "khasra-outline",
        type: "line",
        source: "khasra",
        paint: {
          "line-color": "#6FC04F",
          "line-width": 2
        }
      });

    });

  }, [mouzaId]);

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-view__container" />
    </div>
  );
}