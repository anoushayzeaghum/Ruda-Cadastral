import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getKhasras } from "../../services/api";
import Legend from "./Legend";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ mouzaId }) {

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    // Wait for container to have dimensions (flex layout may not have run yet)
    let rafId;
    const ensureSize = (cb) => {
      const check = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          cb();
          return;
        }
        rafId = requestAnimationFrame(check);
      };
      check();
      return () => {
        if (rafId != null) cancelAnimationFrame(rafId);
      };
    };

    let map;
    let resizeObserver;
    const cancelWait = ensureSize(() => {
      map = new mapboxgl.Map({
        container,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [74.3587, 31.5204], // Lahore Division
        zoom: 8,
        collectResourceTiming: false
      });
      mapInstance.current = map;

      map.on("load", () => {
        map.resize();
        requestAnimationFrame(() => map.resize());
      });

      // Resize map when container size changes (e.g. layout settling, window resize)
      resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(container);
    });

    return () => {
      if (resizeObserver && container) resizeObserver.unobserve(container);
      cancelWait();
      if (map) {
        map.remove();
        mapInstance.current = null;
      }
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
      <Legend />
    </div>
  );
}