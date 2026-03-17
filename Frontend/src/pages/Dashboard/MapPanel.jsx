import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPanel() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  /* =========================
     INITIAL MAP LOAD
  ========================= */
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12", // ✅ ALWAYS LIGHT
    });

    map.current.on("load", () => {
      addGeoJsonLayer();
    });
  }, []);

  /* =========================
     ADD GEOJSON + COLORS
  ========================= */
  const addGeoJsonLayer = async () => {
    if (!map.current) return;

    const response = await fetch("/ruda_phases.geojson");
    const data = await response.json();

    /* ✅ Assign unique color to EACH feature */
    data.features.forEach((feature, index) => {
      feature.properties.color = getColor(index);
    });

    map.current.addSource("ruda-phases", {
      type: "geojson",
      data: data,
    });

    /* =========================
       FILL LAYER
    ========================= */
    map.current.addLayer({
      id: "ruda-fill",
      type: "fill",
      source: "ruda-phases",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.6,
      },
    });

    /* =========================
       OUTLINE
    ========================= */
    map.current.addLayer({
      id: "ruda-outline",
      type: "line",
      source: "ruda-phases",
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
      },
    });

    /* =========================
       AUTO ZOOM TO DATA
    ========================= */
    const bounds = new mapboxgl.LngLatBounds();

    data.features.forEach((feature) => {
      const geom = feature.geometry;

      if (geom.type === "Polygon") {
        geom.coordinates[0].forEach((coord) => bounds.extend(coord));
      }

      if (geom.type === "MultiPolygon") {
        geom.coordinates.forEach((polygon) => {
          polygon[0].forEach((coord) => bounds.extend(coord));
        });
      }
    });

    map.current.fitBounds(bounds, {
      padding: 40,
      duration: 1000,
    });

    /* =========================
       HOVER CURSOR
    ========================= */
    map.current.on("mouseenter", "ruda-fill", () => {
      map.current.getCanvas().style.cursor = "pointer";
    });

    map.current.on("mouseleave", "ruda-fill", () => {
      map.current.getCanvas().style.cursor = "";
    });
  };

  /* =========================
     COLOR GENERATOR
  ========================= */
  const getColor = (i) => {
    const colors = [
      "#22c55e",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#a855f7",
      "#14b8a6",
      "#eab308",
      "#ec4899",
      "#6366f1",
      "#10b981",
    ];

    return colors[i % colors.length];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-full overflow-hidden">
      <div ref={mapContainer} className="h-full w-full rounded-xl" />
    </div>
  );
}