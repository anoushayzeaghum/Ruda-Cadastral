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

/* ---------------------------
SHARED MAP COLORS
Use same theme for boundaries, khasra and murabba
--------------------------- */
const MAP_THEME = {
  fillColor: "#158033", // same green as boundaries
  fillOpacity: 0.2,
  lineColor: "#1e3a5f", // same dark/navy boundary line
  lineWidth: 2,
};

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
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.map = undefined;
  }
}

export default function MapView({
  selectedDivision,
  selectedDistrict,
  selectedTehsil,
  selectedMouza,
  viewBy,
  onParcelSelect,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

      map.addControl(new BasemapControl(), "top-left");
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

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  const clearLayerAndSource = (fillId, lineId, sourceId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing ${sourceId}`, e);
    }
  };

  const clearKhasraLayers = () => {
    clearLayerAndSource(KHASRA_FILL, KHASRA_LINE, KHASRA_SOURCE);
  };

  const clearMurabbaLayers = () => {
    clearLayerAndSource(MURABBA_FILL, MURABBA_LINE, MURABBA_SOURCE);
  };

  /* ---------------------------
  DRAW BOUNDARY
  --------------------------- */
  const drawBoundary = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearLayerAndSource(BOUNDARY_FILL, BOUNDARY_LINE, BOUNDARY_SOURCE);

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
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: BOUNDARY_LINE,
        type: "line",
        source: BOUNDARY_SOURCE,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });

      if (
        geojson.features.length > 0 &&
        viewBy !== "khasra" &&
        viewBy !== "murabba"
      ) {
        zoomToGeoJSON(geojson);
      }
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
      clearKhasraLayers();

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
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: KHASRA_LINE,
        type: "line",
        source: KHASRA_SOURCE,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });

      map.on("click", KHASRA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          if (typeof onParcelSelect === "function") onParcelSelect(feature);
        }
      });

      map.on("mouseenter", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", KHASRA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      zoomToGeoJSON(geojson);
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
      clearMurabbaLayers();

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
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: MURABBA_LINE,
        type: "line",
        source: MURABBA_SOURCE,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });

      zoomToGeoJSON(geojson);
      setFeatureCount(geojson.features.length);
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
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

        if (selectedMouza) {
          geojson = await getMouzaBoundary(
            selectedMouza.mouza_id || selectedMouza.id || selectedMouza,
          );
        } else if (selectedTehsil?.length) {
          const responses = await Promise.all(
            selectedTehsil.map((tehsil) =>
              getTehsilBoundary(tehsil.id || tehsil),
            ),
          );
          geojson = mergeFeatureCollections(responses);
        } else if (selectedDistrict?.length) {
          const responses = await Promise.all(
            selectedDistrict.map((district) =>
              getDistrictBoundary(district.id || district),
            ),
          );
          geojson = mergeFeatureCollections(responses);
        } else if (selectedDivision?.length) {
          const responses = await Promise.all(
            selectedDivision.map((division) =>
              getDivisionBoundary(division.division_i || division),
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
    viewBy,
  ]);

  /* ---------------------------
  LOAD KHASRAS
  --------------------------- */
  useEffect(() => {
    if (!selectedMouza || !isMapReady || viewBy !== "khasra") {
      clearKhasraLayers();
      return;
    }

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mouza_id =
          selectedMouza.mouza_id || selectedMouza.id || selectedMouza;

        const geojson = await getKhasras(mouza_id);

        if (geojson?.features?.length) {
          drawKhasras(geojson);
        } else {
          clearKhasraLayers();
          setFeatureCount(0);
        }
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
      clearMurabbaLayers();
      return;
    }

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mouza_id =
          selectedMouza.mouza_id || selectedMouza.id || selectedMouza;

        const geojson = await getMurabbas(mouza_id);

        if (geojson?.features?.length) {
          drawMurabbas(geojson);
        } else {
          clearMurabbaLayers();
          setFeatureCount(0);
        }
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
    </div>
  );
}
