import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getKhasras } from "../../services/api";
import Legend from "./Legend";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [74.3587, 31.5204];
const DEFAULT_ZOOM = 8;
const KHASRA_SOURCE_ID = "khasra";
const KHASRA_FILL_ID = "khasra-fill";
const KHASRA_OUTLINE_ID = "khasra-outline";

const extendBounds = (coordinates, bounds, markPointFound) => {
  if (!Array.isArray(coordinates)) return;

  if (
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    bounds.extend([coordinates[0], coordinates[1]]);
    markPointFound();
    return;
  }

  coordinates.forEach((item) => extendBounds(item, bounds, markPointFound));
};

const getGeoJsonBounds = (geojson) => {
  if (!Array.isArray(geojson?.features) || !geojson.features.length) {
    return null;
  }

  const bounds = new mapboxgl.LngLatBounds();
  let hasPoint = false;

  geojson.features.forEach((feature) => {
    extendBounds(feature?.geometry?.coordinates, bounds, () => {
      hasPoint = true;
    });
  });

  return hasPoint ? bounds : null;
};

const clearKhasraLayers = (map) => {
  if (map.getLayer(KHASRA_FILL_ID)) map.removeLayer(KHASRA_FILL_ID);
  if (map.getLayer(KHASRA_OUTLINE_ID)) map.removeLayer(KHASRA_OUTLINE_ID);
  if (map.getSource(KHASRA_SOURCE_ID)) map.removeSource(KHASRA_SOURCE_ID);
};

const addKhasraLayers = (map, geojson) => {
  if (map.getSource(KHASRA_SOURCE_ID)) {
    map.getSource(KHASRA_SOURCE_ID).setData(geojson);
    return;
  }

  map.addSource(KHASRA_SOURCE_ID, {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: KHASRA_FILL_ID,
    type: "fill",
    source: KHASRA_SOURCE_ID,
    paint: {
      "fill-color": "#6FC04F",
      "fill-opacity": 0.35,
    },
  });

  map.addLayer({
    id: KHASRA_OUTLINE_ID,
    type: "line",
    source: KHASRA_SOURCE_ID,
    paint: {
      "line-color": "#D9FFCB",
      "line-width": 1.8,
    },
  });
};

export default function MapView({ selectedMouza }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const mouzaId = selectedMouza?.id;

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const handleMapLoad = () => {
      setIsMapReady(true);
    };

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.on("load", handleMapLoad);

    mapInstance.current = map;

    return () => {
      map.off("load", handleMapLoad);
      map.remove();
      mapInstance.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !isMapReady) return undefined;

    const map = mapInstance.current;

    if (!mouzaId) {
      clearKhasraLayers(map);
      setFeatureCount(0);
      setLoadError("");
      setIsLoading(false);
      return undefined;
    }

    let ignore = false;

    const loadKhasras = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const geojson = await getKhasras(mouzaId);

        if (ignore) return;

        const normalizedGeoJson = {
          type: "FeatureCollection",
          features: Array.isArray(geojson?.features) ? geojson.features : [],
        };

        addKhasraLayers(map, normalizedGeoJson);
        setFeatureCount(normalizedGeoJson.features.length);

        const bounds = getGeoJsonBounds(normalizedGeoJson);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 50,
            duration: 800,
          });
        }
      } catch {
        if (ignore) return;

        clearKhasraLayers(map);
        setFeatureCount(0);
        setLoadError("Unable to load cadastral data for the selected mouza.");
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadKhasras();

    return () => {
      ignore = true;
    };
  }, [isMapReady, mouzaId]);

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-view__container" />

      <section
        className="map-view__status"
        aria-label="Current map layer status"
      >
        <p className="map-view__status-eyebrow">Live Cadastral Viewer</p>
        <h2 className="map-view__status-title">
          {selectedMouza?.name ?? "Select a mouza to load cadastral data"}
        </h2>
        <p className="map-view__status-text">
          {selectedMouza
            ? `Showing khasra boundaries for ${selectedMouza.name}${selectedMouza.tehsil ? `, ${selectedMouza.tehsil}` : ""}${selectedMouza.district ? `, ${selectedMouza.district}` : ""}.`
            : "Use the administrative filters in the header to load district, tehsil, mouza, and khasra data from the API."}
        </p>

        <div className="map-view__badge-row">
          <span className="map-view__badge">
            Mouza ID: {selectedMouza?.id ?? "—"}
          </span>
          <span className="map-view__badge">Khasras: {featureCount}</span>
          <span className="map-view__badge">
            {isLoading ? "Loading layer..." : "Map ready"}
          </span>
        </div>

        {loadError ? (
          <p
            className="map-view__status-text map-view__status-text--error"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}
      </section>

      <Legend
        featureCount={featureCount}
        selectedMouzaName={selectedMouza?.name}
        isLoading={isLoading}
      />
    </div>
  );
}
