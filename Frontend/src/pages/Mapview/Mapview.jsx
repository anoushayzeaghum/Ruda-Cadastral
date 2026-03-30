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
  getRudaGeoJSON,
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

const SELECTED_SOURCE = "selected-source";
const SELECTED_FILL = "selected-fill";
const SELECTED_LINE = "selected-line";

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
AREA CALCULATION (geodesic)
Returns area in square meters
--------------------------- */
function ringArea(coords) {
  let area = 0;
  if (!coords || coords.length === 0) return 0;
  for (let i = 0, len = coords.length; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  // Radius of Earth in meters (WGS84)
  return (Math.abs(area) * 6378137 * 6378137) / 2.0;
}

function computeArea(feature) {
  if (!feature || !feature.geometry) return 0;
  const geom = feature.geometry;
  let total = 0;

  if (geom.type === "Polygon") {
    // geom.coordinates -> [ [ring0], [ring1], ... ]
    geom.coordinates.forEach((ring, idx) => {
      total += ringArea(ring);
    });
  } else if (geom.type === "MultiPolygon") {
    // geom.coordinates -> [ [ [ring], ... ], ... ]
    geom.coordinates.forEach((poly) => {
      poly.forEach((ring) => {
        total += ringArea(ring);
      });
    });
  }

  return Math.abs(total); // square meters
}

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
  layers = {},
  selectedRudaPhaseIds = [],
  basemap = "Outdoors",
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});

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

  const getLayerIdsFor = (level) => ({
    source: `${level}-boundary-source`,
    fill: `${level}-boundary-fill`,
    line: `${level}-boundary-line`,
  });

  const clearBoundaryLevel = (level) => {
    const map = mapInstance.current;
    if (!map) return;
    const ids = getLayerIdsFor(level);

    try {
      if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
      if (map.getLayer(ids.line)) map.removeLayer(ids.line);
      if (map.getSource(ids.source)) map.removeSource(ids.source);
    } catch (e) {
      // ignore
    }
  };

  const drawBoundaryLevel = (level, geojson) => {
    const map = mapInstance.current;
    if (!map) return;
    const ids = getLayerIdsFor(level);

    // remove existing
    clearBoundaryLevel(level);

    try {
      map.addSource(ids.source, {
        type: "geojson",
        data: geojson || emptyFeatureCollection(),
      });

      map.addLayer({
        id: ids.fill,
        type: "fill",
        source: ids.source,
        paint: {
          "fill-color": MAP_THEME.fillColor,
          "fill-opacity": MAP_THEME.fillOpacity,
        },
      });

      map.addLayer({
        id: ids.line,
        type: "line",
        source: ids.source,
        paint: {
          "line-color": MAP_THEME.lineColor,
          "line-width": MAP_THEME.lineWidth,
        },
      });
      // persist geojson so we can restore after style change
      try {
        currentGeojson.current[level] = geojson;
      } catch (e) {}
    } catch (e) {
      console.error("drawBoundaryLevel error", e);
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

      // clear any selected highlight when re-drawing
      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {
        // ignore
      }

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

      try {
        currentGeojson.current.khasra = geojson;
      } catch (e) {}

      // ensure selected feature source + highlight layers exist
      if (!map.getSource(SELECTED_SOURCE)) {
        map.addSource(SELECTED_SOURCE, {
          type: "geojson",
          data: emptyFeatureCollection(),
        });

        map.addLayer({
          id: SELECTED_FILL,
          type: "fill",
          source: SELECTED_SOURCE,
          paint: {
            "fill-color": "#FFD54F",
            "fill-opacity": 0.7,
          },
        });

        map.addLayer({
          id: SELECTED_LINE,
          type: "line",
          source: SELECTED_SOURCE,
          paint: {
            "line-color": "#b38f00",
            "line-width": 2,
          },
        });
      }

      map.on("click", KHASRA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];

          // compute area and set highlight
          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          // set selected feature to highlight source
          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };
          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "khasra";
            onParcelSelect(cloned);
          }
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

      // clear any selected highlight when re-drawing
      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {
        // ignore
      }

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

      try {
        currentGeojson.current.murabba = geojson;
      } catch (e) {}

      // ensure selected highlight layers exist (may already exist from khasra)
      if (!map.getSource(SELECTED_SOURCE)) {
        map.addSource(SELECTED_SOURCE, {
          type: "geojson",
          data: emptyFeatureCollection(),
        });

        map.addLayer({
          id: SELECTED_FILL,
          type: "fill",
          source: SELECTED_SOURCE,
          paint: {
            "fill-color": "#FFD54F",
            "fill-opacity": 0.7,
          },
        });

        map.addLayer({
          id: SELECTED_LINE,
          type: "line",
          source: SELECTED_SOURCE,
          paint: {
            "line-color": "#b38f00",
            "line-width": 2,
          },
        });
      }

      map.on("click", MURABBA_FILL, (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];

          const area_m2 = computeArea(feature);
          const area_acres = area_m2 / 4046.8564224;

          const selectedGeo = {
            type: "FeatureCollection",
            features: [feature],
          };
          try {
            const src = map.getSource(SELECTED_SOURCE);
            if (src) src.setData(selectedGeo);
          } catch (err) {
            console.warn("Could not set selected feature", err);
          }

          if (typeof onParcelSelect === "function") {
            const cloned = JSON.parse(JSON.stringify(feature));
            cloned.properties = cloned.properties || {};
            cloned.properties._area_m2 = area_m2;
            cloned.properties._area_acres = area_acres;
            cloned.properties._layerType = "murabba";
            onParcelSelect(cloned);
          }
        }
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
      try {
        setIsLoading(true);
        setError("");

        // Clear levels that will be redrawn or disabled
        ["division", "district", "tehsil", "mouza"].forEach((lvl) => {
          if (!layers || !layers[`${lvl}Boundaries`]) {
            clearBoundaryLevel(lvl);
          }
        });

        // Collect geojsons to draw
        const drawPromises = [];

        // Mouza - highest priority when selected
        if (layers?.mouzaBoundaries && selectedMouza) {
          drawPromises.push(
            getMouzaBoundary(
              selectedMouza.mouza_id || selectedMouza.id || selectedMouza,
            )
              .then((g) => ({ level: "mouza", geojson: g }))
              .catch((e) => {
                console.error("mouza boundary error", e);
                return null;
              }),
          );
        }

        // Tehsil
        if (layers?.tehsilBoundaries && selectedTehsil?.length) {
          const p = Promise.all(
            selectedTehsil.map((t) => getTehsilBoundary(t.id || t)),
          )
            .then((resps) => ({
              level: "tehsil",
              geojson: mergeFeatureCollections(resps),
            }))
            .catch((e) => {
              console.error("tehsil boundary error", e);
              return null;
            });

          drawPromises.push(p);
        }

        // District
        if (layers?.districtBoundaries && selectedDistrict?.length) {
          const p = Promise.all(
            selectedDistrict.map((d) => getDistrictBoundary(d.id || d)),
          )
            .then((resps) => ({
              level: "district",
              geojson: mergeFeatureCollections(resps),
            }))
            .catch((e) => {
              console.error("district boundary error", e);
              return null;
            });

          drawPromises.push(p);
        }

        // Division
        if (layers?.divisionBoundaries && selectedDivision?.length) {
          const p = Promise.all(
            selectedDivision.map((div) =>
              getDivisionBoundary(div.division_i || div),
            ),
          )
            .then((resps) => ({
              level: "division",
              geojson: mergeFeatureCollections(resps),
            }))
            .catch((e) => {
              console.error("division boundary error", e);
              return null;
            });

          drawPromises.push(p);
        }

        const results = await Promise.all(drawPromises);

        const valid = results.filter(Boolean);
        if (valid.length === 0) {
          // nothing to draw, ensure previous boundary layers cleared
          ["division", "district", "tehsil", "mouza"].forEach((lvl) =>
            clearBoundaryLevel(lvl),
          );
          setFeatureCount(0);
          return;
        }

        // Draw each level independently so multiple can show
        valid.forEach((item) => {
          if (item && item.geojson) {
            drawBoundaryLevel(item.level, item.geojson);
          }
        });

        // zoom to combined extent (merge features)
        const merged = mergeFeatureCollections(valid.map((v) => v.geojson));
        if (merged.features.length) zoomToGeoJSON(merged);
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
    layers,
  ]);

  /* ---------------------------
  RESTORE LAYERS AFTER BASEMAP CHANGE
  --------------------------- */
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    // If basemap is a named key, map to style URL
    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl) return;

    // if style already equals desired, do nothing
    if (map.getStyle && map.getStyle().sprite === styleUrl) return;

    try {
      map.setStyle(styleUrl);

      map.once("style.load", () => {
        // redraw persisted geojsons
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;
            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else {
              // boundary levels and ruda-* keys
              drawBoundaryLevel(key, g);
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });
    } catch (e) {
      console.error("Failed to change basemap style", e);
    }
  }, [basemap, isMapReady]);

  /* ---------------------------
  RUDA PHASES
  --------------------------- */
  useEffect(() => {
    if (!isMapReady) return;

    const loadRuda = async () => {
      const map = mapInstance.current;
      if (!layers?.rudaBoundary) {
        // clear any ruda-* layers
        try {
          // we don't know exact ids, but selectedRudaPhaseIds may have ids
          (selectedRudaPhaseIds || []).forEach((id) => {
            const lvl = `ruda-${id}`;
            clearBoundaryLevel(lvl);
          });
        } catch (e) {}
        return;
      }

      if (!selectedRudaPhaseIds?.length) return;

      try {
        setIsLoading(true);
        const promises = selectedRudaPhaseIds.map((gid) =>
          getRudaGeoJSON(gid)
            .then((g) => ({ gid, geojson: g }))
            .catch((e) => {
              console.error("ruda geojson error", e);
              return null;
            }),
        );

        const results = await Promise.all(promises);

        results.filter(Boolean).forEach((r) => {
          drawBoundaryLevel(`ruda-${r.gid}`, r.geojson);
          try {
            currentGeojson.current[`ruda-${r.gid}`] = r.geojson;
          } catch (e) {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRuda();
  }, [isMapReady, layers?.rudaBoundary, selectedRudaPhaseIds]);

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
