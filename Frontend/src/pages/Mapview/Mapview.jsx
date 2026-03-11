import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Legend from "./Legend";

import {
  getDivisionBoundary,
  getDistrictBoundary,
  getTehsilBoundary,
  getMouzaBoundary,
  getKhasras,
} from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_CENTER = [74.3587, 31.5204];
const DEFAULT_ZOOM = 8;

const BOUNDARY_SOURCE = "boundary-source";
const BOUNDARY_FILL = "boundary-fill";
const BOUNDARY_LINE = "boundary-line";

const KHASRA_SOURCE = "khasra-source";
const KHASRA_FILL = "khasra-fill";
const KHASRA_LINE = "khasra-line";

export default function MapView({
  selectedDivision,
  selectedDistrict,
  selectedTehsil,
  selectedMouza,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------
  // MAP INITIALIZATION
  // ---------------------------
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      map.setProjection("globe");
      map.addControl(new mapboxgl.NavigationControl(), "top-left");

      map.on("load", () => {
        setIsMapReady(true);
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      };
    } catch (e) {
      console.error("Map initialization error:", e);
      setError("Failed to initialize map");
    }
  }, []);

  // ---------------------------
  // DRAW BOUNDARY
  // ---------------------------
  const drawBoundary = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      // Remove existing layers
      if (map.getLayer(BOUNDARY_FILL)) map.removeLayer(BOUNDARY_FILL);
      if (map.getLayer(BOUNDARY_LINE)) map.removeLayer(BOUNDARY_LINE);
      if (map.getSource(BOUNDARY_SOURCE)) map.removeSource(BOUNDARY_SOURCE);

      // Validate GeoJSON
      if (!geojson?.features || !Array.isArray(geojson.features)) {
        console.warn("Invalid GeoJSON format:", geojson);
        return;
      }

      // Add source
      map.addSource(BOUNDARY_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      // Add fill layer
      map.addLayer({
        id: BOUNDARY_FILL,
        type: "fill",
        source: BOUNDARY_SOURCE,
        paint: {
          "fill-color": "#1e3a5f",
          "fill-opacity": 0.2,
        },
      });

      // Add line layer
      map.addLayer({
        id: BOUNDARY_LINE,
        type: "line",
        source: BOUNDARY_SOURCE,
        paint: {
          "line-color": "#1e3a5f",
          "line-width": 3,
        },
      });

      // Zoom to boundary
      if (geojson.features.length > 0) {
        zoomToGeoJSON(geojson);
      }
    } catch (e) {
      console.error("Error drawing boundary:", e);
      setError("Failed to display boundary");
    }
  };

  // ---------------------------
  // DRAW KHASRAS
  // ---------------------------
  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      // Remove existing layers
      if (map.getLayer(KHASRA_FILL)) map.removeLayer(KHASRA_FILL);
      if (map.getLayer(KHASRA_LINE)) map.removeLayer(KHASRA_LINE);
      if (map.getSource(KHASRA_SOURCE)) map.removeSource(KHASRA_SOURCE);

      // Validate GeoJSON
      if (!geojson?.features || !Array.isArray(geojson.features)) {
        console.warn("Invalid GeoJSON format for Khasras:", geojson);
        setFeatureCount(0);
        return;
      }

      // Add source
      map.addSource(KHASRA_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      // Add fill layer
      map.addLayer({
        id: KHASRA_FILL,
        type: "fill",
        source: KHASRA_SOURCE,
        paint: {
          "fill-color": "#6FC04F",
          "fill-opacity": 0.35,
        },
      });

      // Add line layer
      map.addLayer({
        id: KHASRA_LINE,
        type: "line",
        source: KHASRA_SOURCE,
        paint: {
          "line-color": "#D9FFCB",
          "line-width": 1.5,
        },
      });

      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Error drawing Khasras:", e);
      setError("Failed to display Khasras");
    }
  };

  // ---------------------------
  // ZOOM FUNCTION
  // ---------------------------
  const zoomToGeoJSON = (geojson) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();

      geojson.features.forEach((feature) => {
        const coords = feature.geometry?.coordinates;
        if (!coords) return;

        const traverse = (c) => {
          if (typeof c[0] === "number" && typeof c[1] === "number") {
            bounds.extend(c);
          } else if (Array.isArray(c)) {
            c.forEach(traverse);
          }
        };

        traverse(coords);
      });

      if (bounds.isEmpty()) {
        console.warn("Bounds are empty");
        return;
      }

      map.fitBounds(bounds, { padding: 50, duration: 800 });
    } catch (e) {
      console.error("Error zooming to GeoJSON:", e);
    }
  };

  // ---------------------------
  // LOAD BOUNDARY WHEN FILTER CHANGES
  // ---------------------------
  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    const loadBoundary = async () => {
      let geojson = null;

      try {
        setIsLoading(true);
        setError("");

        // Check filters in priority order: Mouza > Tehsil > District > Division
        if (selectedMouza) {
          console.log("Loading Mouza boundary:", selectedMouza.mouza_id);
          geojson = await getMouzaBoundary(selectedMouza.mouza_id);
        } else if (selectedTehsil) {
          console.log("Loading Tehsil boundary:", selectedTehsil.id);
          geojson = await getTehsilBoundary(selectedTehsil.id);
        } else if (selectedDistrict) {
          console.log("Loading District boundary:", selectedDistrict.id);
          geojson = await getDistrictBoundary(selectedDistrict.id);
        } else if (selectedDivision) {
          console.log(
            "Loading Division boundary:",
            selectedDivision.division_i,
          );
          geojson = await getDivisionBoundary(selectedDivision.division_i);
        }

        if (geojson?.features?.length > 0) {
          drawBoundary(geojson);
          setError("");
        }
      } catch (e) {
        console.error("Boundary load error:", e);
        setError("Failed to load boundary data");
      } finally {
        setIsLoading(false);
      }
    };

    loadBoundary();
  }, [
    selectedMouza,
    selectedTehsil,
    selectedDistrict,
    selectedDivision,
    isMapReady,
  ]);

  // ---------------------------
  // LOAD KHASRAS WHEN MOUZA SELECTED
  // ---------------------------
  useEffect(() => {
    if (!selectedMouza || !isMapReady || !mapInstance.current) return;

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        console.log("Loading Khasras for Mouza:", selectedMouza.mouza_id);

        const geojson = await getKhasras(selectedMouza.mouza_id);
        if (geojson?.features?.length > 0) {
          drawKhasras(geojson);
        }
      } catch (e) {
        console.error("Khasra load error:", e);
        setError("Failed to load Khasra data");
      } finally {
        setIsLoading(false);
      }
    };

    loadKhasras();
  }, [selectedMouza, isMapReady]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "#f0f0f0" }}
      />

      {error && (
        <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-5 right-5 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}

      <Legend
        featureCount={featureCount}
        selectedMouzaName={selectedMouza?.mouza}
        isLoading={isLoading}
      />
    </div>
  );
}
