import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getDivisionBoundary } from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const LAHORE_DIVISION_ID = 6; // <-- Lahore ka actual division_i yahan do

const LAHORE_SOURCE_ID = "lahore-division-source";
const LAHORE_FILL_ID = "lahore-division-fill";
const LAHORE_OUTLINE_ID = "lahore-division-outline";

const RUDA_SOURCE_ID = "ruda-phases-source";
const RUDA_FILL_ID = "ruda-phases-fill";
const RUDA_OUTLINE_ID = "ruda-phases-outline";

export default function MapPanel() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.3587, 31.5204],
      zoom: 10,
    });

    mapRef.current = map;

    map.on("load", async () => {
      await loadLayers();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const loadLayers = async () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      // 1) Lahore layer from backend
      const lahoreGeoJson = await getDivisionBoundary(LAHORE_DIVISION_ID);

      // 2) RUDA layer from public geojson
      const rudaResponse = await fetch("/ruda_phases.geojson");
      const rudaGeoJson = await rudaResponse.json();

      if (!lahoreGeoJson?.features?.length && !rudaGeoJson?.features?.length) {
        return;
      }

      assignRudaColors(rudaGeoJson);

      removeLayerIfExists(map, RUDA_FILL_ID);
      removeLayerIfExists(map, RUDA_OUTLINE_ID);
      removeSourceIfExists(map, RUDA_SOURCE_ID);

      removeLayerIfExists(map, LAHORE_FILL_ID);
      removeLayerIfExists(map, LAHORE_OUTLINE_ID);
      removeSourceIfExists(map, LAHORE_SOURCE_ID);

      // =========================
      // LAHORE FIRST (bottom)
      // =========================
      if (lahoreGeoJson?.features?.length) {
        map.addSource(LAHORE_SOURCE_ID, {
          type: "geojson",
          data: lahoreGeoJson,
        });

        map.addLayer({
          id: LAHORE_FILL_ID,
          type: "fill",
          source: LAHORE_SOURCE_ID,
          paint: {
            "fill-color": "#94a3b8",
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: LAHORE_OUTLINE_ID,
          type: "line",
          source: LAHORE_SOURCE_ID,
          paint: {
            "line-color": "#475569",
            "line-width": 2,
          },
        });
      }

      // =========================
      // RUDA SECOND (top)
      // =========================
      if (rudaGeoJson?.features?.length) {
        map.addSource(RUDA_SOURCE_ID, {
          type: "geojson",
          data: rudaGeoJson,
        });

        map.addLayer({
          id: RUDA_FILL_ID,
          type: "fill",
          source: RUDA_SOURCE_ID,
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.65,
          },
        });

        map.addLayer({
          id: RUDA_OUTLINE_ID,
          type: "line",
          source: RUDA_SOURCE_ID,
          paint: {
            "line-color": "#ffffff",
            "line-width": 1.2,
          },
        });
      }

      // Combined zoom
      fitToCombinedBounds(map, lahoreGeoJson, rudaGeoJson);

      // Cursor on RUDA top layer
      if (map.getLayer(RUDA_FILL_ID)) {
        map.on("mouseenter", RUDA_FILL_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", RUDA_FILL_ID, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    } catch (error) {
      console.error("Error loading Lahore + RUDA layers:", error);
    }
  };

  const assignRudaColors = (geojson) => {
    if (!geojson?.features) return;

    geojson.features.forEach((feature, index) => {
      if (!feature.properties) feature.properties = {};
      feature.properties.color = getColor(index);
    });
  };

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

  const removeLayerIfExists = (map, layerId) => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  };

  const removeSourceIfExists = (map, sourceId) => {
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  };

  const fitToCombinedBounds = (map, ...geojsonList) => {
    const bounds = new mapboxgl.LngLatBounds();

    geojsonList.forEach((geojson) => {
      if (!geojson?.features?.length) return;

      geojson.features.forEach((feature) => {
        const coords = feature.geometry?.coordinates;
        if (!coords) return;

        traverseCoordinates(coords, (coord) => bounds.extend(coord));
      });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 40,
        duration: 1000,
      });
    }
  };

  const traverseCoordinates = (coords, callback) => {
    if (typeof coords[0] === "number") {
      callback(coords);
      return;
    }

    coords.forEach((c) => traverseCoordinates(c, callback));
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-white">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
