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
  getMurabbas,
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

const MURABBA_SOURCE = "murabba-source";
const MURABBA_FILL = "murabba-fill";
const MURABBA_LINE = "murabba-line";

const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const mergeFeatureCollections = (collections) => ({
  type: "FeatureCollection",
  features: collections.flatMap((collection) =>
    Array.isArray(collection?.features) ? collection.features : [],
  ),
});

/* ---------------------------
BASEMAP STYLES
--------------------------- */

const BASEMAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

/* ---------------------------
BASEMAP CONTROL
--------------------------- */

class BasemapControl {
  onAdd(map) {
    this.map = map;

    const container = document.createElement("div");
    container.className =
      "mapboxgl-ctrl mapboxgl-ctrl-group bg-white rounded shadow";

    const select = document.createElement("select");
    select.style.padding = "4px";
    select.style.fontSize = "12px";
    select.style.border = "none";
    select.style.outline = "none";
    select.style.cursor = "pointer";

    Object.keys(BASEMAP_STYLES).forEach((name) => {
      const option = document.createElement("option");
      option.value = BASEMAP_STYLES[name];
      option.textContent = name;
      select.appendChild(option);
    });

    select.onchange = (e) => {
      map.setStyle(e.target.value);
    };

    container.appendChild(select);
    this.container = container;

    return container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

export default function MapView({
  selectedDivision,
  selectedDistrict,
  selectedTehsil,
  selectedMouza,
  viewBy,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const popupRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedKhasra, setSelectedKhasra] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  /* ---------------------------
  MAP INITIALIZATION
  --------------------------- */

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: BASEMAP_STYLES.Outdoors,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });

      map.setProjection("globe");

      /* Add Basemap selector */
      map.addControl(new BasemapControl(), "top-left");

      /* Add zoom buttons */
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

  /* ---------------------------
  DRAW BOUNDARY
  --------------------------- */

  const drawBoundary = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(BOUNDARY_FILL)) map.removeLayer(BOUNDARY_FILL);
      if (map.getLayer(BOUNDARY_LINE)) map.removeLayer(BOUNDARY_LINE);
      if (map.getSource(BOUNDARY_SOURCE)) map.removeSource(BOUNDARY_SOURCE);

      if (!geojson?.features || !Array.isArray(geojson.features)) return;

      map.addSource(BOUNDARY_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: BOUNDARY_FILL,
        type: "fill",
        source: BOUNDARY_SOURCE,
        paint: {
          "fill-color": "#158033",
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: BOUNDARY_LINE,
        type: "line",
        source: BOUNDARY_SOURCE,
        paint: {
          "line-color": "#1e3a5f",
          "line-width": 3,
        },
      });

      if (geojson.features.length > 0) zoomToGeoJSON(geojson);
    } catch (e) {
      console.error("Boundary drawing error:", e);
      setError("Failed to display boundary");
    }
  };

  /* ---------------------------
  DRAW KHASRAS
  --------------------------- */

  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(KHASRA_FILL)) map.removeLayer(KHASRA_FILL);
      if (map.getLayer(KHASRA_LINE)) map.removeLayer(KHASRA_LINE);
      if (map.getSource(KHASRA_SOURCE)) map.removeSource(KHASRA_SOURCE);

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      map.addSource(KHASRA_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: KHASRA_FILL,
        type: "fill",
        source: KHASRA_SOURCE,
        paint: {
          "fill-color": "#6FC04F",
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: KHASRA_LINE,
        type: "line",
        source: KHASRA_SOURCE,
        paint: {
          "line-color": "#D9FFCB",
          "line-width": 1.5,
        },
      });

      // Add click event listener for khasras
      map.on("click", KHASRA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setSelectedKhasra(feature);
          setPopupPosition({
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        }
      });

      // Change cursor on hover
      map.on("mouseenter", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Khasra drawing error:", e);
      setError("Failed to display Khasras");
    }
  };

  /* ---------------------------
  DRAW MURABBAS
  --------------------------- */

  const drawMurabbas = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(MURABBA_FILL)) map.removeLayer(MURABBA_FILL);
      if (map.getLayer(MURABBA_LINE)) map.removeLayer(MURABBA_LINE);
      if (map.getSource(MURABBA_SOURCE)) map.removeSource(MURABBA_SOURCE);

      if (!geojson?.features || !Array.isArray(geojson.features)) {
        setFeatureCount(0);
        return;
      }

      map.addSource(MURABBA_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: MURABBA_FILL,
        type: "fill",
        source: MURABBA_SOURCE,
        paint: {
          "fill-color": "#FF6B35",
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: MURABBA_LINE,
        type: "line",
        source: MURABBA_SOURCE,
        paint: {
          "line-color": "#FF8C5A",
          "line-width": 2,
        },
      });

      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
  };

  /* ---------------------------
  ZOOM FUNCTION
  --------------------------- */

  const zoomToGeoJSON = (geojson) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c[0] === "number") bounds.extend(c);
        else c.forEach(traverse);
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50 });
  };

  /* ---------------------------
  LOAD BOUNDARY
  --------------------------- */

  useEffect(() => {
    if (!isMapReady) return;

    const loadBoundary = async () => {
      let geojson = emptyFeatureCollection();

      try {
        setIsLoading(true);
        setError("");

        if (selectedMouza)
          geojson = await getMouzaBoundary(
            selectedMouza.mouza_id || selectedMouza.id,
          );
        else if (selectedTehsil?.length) {
          const responses = await Promise.all(
            selectedTehsil.map((tehsil) => getTehsilBoundary(tehsil.id)),
          );
          geojson = mergeFeatureCollections(responses);
        } else if (selectedDistrict?.length) {
          const responses = await Promise.all(
            selectedDistrict.map((district) => getDistrictBoundary(district.id)),
          );
          geojson = mergeFeatureCollections(responses);
        } else if (selectedDivision?.length) {
          const responses = await Promise.all(
            selectedDivision.map((division) =>
              getDivisionBoundary(division.division_i),
            ),
          );
          geojson = mergeFeatureCollections(responses);
        }

        drawBoundary(geojson);
      } catch (e) {
        console.error("Boundary load error:", e);
        setError("Failed to load boundary");
      } finally {
        setIsLoading(false);
      }
    };

    loadBoundary();
  }, [
    selectedDivision,
    selectedDistrict,
    selectedTehsil,
    selectedMouza,
    isMapReady,
  ]);

  /* ---------------------------
  LOAD KHASRAS
  --------------------------- */

  useEffect(() => {
    if (!selectedMouza || !isMapReady || viewBy !== "khasra") {
      setSelectedKhasra(null);
      return;
    }

    const loadKhasras = async () => {
      try {
        setIsLoading(true);

        const mouza_id = selectedMouza.mouza_id || selectedMouza.id;
        const geojson = await getKhasras(mouza_id);
        if (geojson?.features?.length) drawKhasras(geojson);
      } catch (e) {
        console.error("Khasra load error:", e);
        setError("Failed to load Khasras");
      } finally {
        setIsLoading(false);
      }
    };

    loadKhasras();
  }, [selectedMouza, isMapReady, viewBy]);

  /* ---------------------------
  LOAD MURABBAS
  --------------------------- */

  useEffect(() => {
    if (!selectedMouza || !isMapReady || viewBy !== "murabba") {
      setSelectedKhasra(null);
      return;
    }

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);

        const mouza_id = selectedMouza.mouza_id || selectedMouza.id;
        const geojson = await getMurabbas(mouza_id);
        if (geojson?.features?.length) drawMurabbas(geojson);
      } catch (e) {
        console.error("Murabba load error:", e);
        setError("Failed to load Murabbas");
      } finally {
        setIsLoading(false);
      }
    };

    loadMurabbas();
  }, [selectedMouza, isMapReady, viewBy]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

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

      {selectedKhasra && (
        <KhasraPopup
          feature={selectedKhasra}
          position={popupPosition}
          onClose={() => setSelectedKhasra(null)}
        />
      )}
    </div>
  );
}

/* ---------------------------
KHASRA POPUP COMPONENT
--------------------------- */

function KhasraPopup({ feature, position, onClose }) {
  const idFields = new Set([
    "gid",
    "id",
    "mouza_id",
    "tehsil_id",
    "dist_id",
    "qh_id",
    "pc_id",
    "khasra_id",
    "khewat_id",
    "divn_id",
  ]);

  const properties = feature.properties || {};

  const filteredProperties = Object.entries(properties)
    .filter(([key]) => !idFields.has(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="absolute z-50 bg-white rounded-lg shadow-2xl border-2 border-green-600 max-w-sm max-h-96 overflow-y-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">Khasra Details</h3>
          <button
            onClick={onClose}
            className="text-white text-xl font-bold hover:bg-green-700 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          {filteredProperties.length > 0 ? (
            filteredProperties.map(([key, value]) => (
              <div key={key} className="border-b border-slate-200 pb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">
                  {formatLabel(key)}
                </p>
                <p className="text-sm text-slate-900 mt-1">
                  {formatValue(value)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No information available</p>
          )}
        </div>
      </div>
    </>
  );
}

function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatValue(value) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
