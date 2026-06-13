import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MapControls from "./MapControls";

import {
  getDistrictBoundary,
  getTehsilBoundary,
  getMauzaBoundary,
  getKhasras,
  getMurabbas,
  getRudaGeoJSON,
  getRudaProposedRoadsGeoJSON,
  getTrijunctionPoints,
} from "../../services/api";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Start zoomed out so the globe/world is visible on initial load
const DEFAULT_CENTER = [69.3451, 30.3753];
const DEFAULT_ZOOM = 5;

const KHASRA_SOURCE = "khasra-source";
const KHASRA_FILL = "khasra-fill";
const KHASRA_LINE = "khasra-line";

const MURABBA_SOURCE = "murabba-source";
const MURABBA_FILL = "murabba-fill";
const MURABBA_LINE = "murabba-line";

const SELECTED_SOURCE = "selected-source";
const SELECTED_FILL = "selected-fill";
const SELECTED_LINE = "selected-line";
const SELECTED_CORNER_SOURCE = "selected-corner-source";
const SELECTED_CORNER_LAYER = "selected-corner-layer";
const SELECTED_CORNER_BOX_LAYER = "selected-corner-box-layer";
const SELECTED_CORNER_TEXT_LAYER = "selected-corner-text-layer";

const CONTROL_POINTS_SOURCE = "control-points-source";
const CONTROL_POINTS_LAYER = "control-points-layer";

const TRI_JUNCTION_POINTS_SOURCE = "tri-junction-points-source";
const TRI_JUNCTION_POINTS_LAYER = "tri-junction-points-layer";
const TRI_JUNCTION_TRIANGLE_IMAGE = "tri-junction-triangle-marker";

const MAP_THEME = {
  fillColor: "#158033",
  fillOpacity: 0.2,
  lineColor: "#1e3a5f",
  lineWidth: 2,
};

const RUDA_PHASE_COLORS = [
  "#6bb7e8",
  "#f8d56b",
  "#6bd69a",
  "#f59e72",
  "#b99cf3",
  "#78d6d0",
  "#f3a6c8",
  "#a7d77b",
  "#f4b860",
  "#86a8e7",
  "#d7b377",
  "#8dd3c7",
];

const ROAD_STYLE_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
];

const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRudaPhaseIdFromLevel = (level = "") => {
  const match = String(level).match(/^ruda-(.+)$/);
  return match?.[1] || "";
};

const getRudaPhaseLabel = (props = {}, phaseId = "") => {
  const candidates = [
    props.phase,
    props.phase_name,
    props.name,
    props.folderpath,
    props.popupinfo,
    props.snippet,
  ];

  for (const value of candidates) {
    const clean = stripHtml(value);
    if (!clean) continue;

    const phaseMatch = clean.match(/phase\s*[-_:]?\s*([a-z0-9]+)/i);
    if (phaseMatch?.[1]) return `Phase ${phaseMatch[1]}`;

    if (clean.length <= 28) return clean;
    return clean.slice(0, 28);
  }

  return phaseId ? `Phase ${phaseId}` : "RUDA Phase";
};

const getRoadLayerName = (props = {}) =>
  String(
    props.layer ||
      props.Layer ||
      props.road_layer ||
      props.road_type ||
      props.name ||
      "Proposed Road",
  ).trim() || "Proposed Road";

const getRoadColor = (layerName = "") => {
  const index = hashString(layerName) % ROAD_STYLE_PALETTE.length;
  return ROAD_STYLE_PALETTE[index];
};

const getRoadWidth = (layerName = "") => {
  const text = String(layerName || "").toLowerCase();

  if (text.includes("300") || text.includes("express") || text.includes("motorway")) return 8;
  if (text.includes("200") || text.includes("primary") || text.includes("arterial")) return 7;
  if (text.includes("150") || text.includes("secondary")) return 6;
  if (text.includes("120") || text.includes("100")) return 5;
  if (text.includes("80") || text.includes("60") || text.includes("local")) return 4;

  return 4.5;
};

const getUniqueRoadLayerNames = (features = []) => {
  const seen = new Set();
  const names = [];

  features.forEach((feature) => {
    const name = getRoadLayerName(feature?.properties || {});
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  });

  return names;
};

const buildRoadMatchExpression = (layerNames, valueGetter, fallback) => {
  const expression = ["match", ["to-string", ["coalesce", ["get", "layer"], "Proposed Road"]]];

  layerNames.forEach((name) => {
    expression.push(name, valueGetter(name));
  });

  expression.push(fallback);
  return expression;
};

const prepareRudaGeojsonForDisplay = (level, geojson) => {
  const phaseId = getRudaPhaseIdFromLevel(level);
  const color = getRudaPhaseColor(phaseId);

  return {
    type: "FeatureCollection",
    features: (geojson?.features || []).map((feature) => {
      const props = feature?.properties || {};
      return {
        ...feature,
        properties: {
          ...props,
          _ruda_phase_id: phaseId,
          _ruda_phase_color: color,
          _ruda_phase_label: getRudaPhaseLabel(props, phaseId),
        },
      };
    }),
  };
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

  return (Math.abs(area) * 6378137 * 6378137) / 2.0;
}

function computeArea(feature) {
  if (!feature || !feature.geometry) return 0;

  const geom = feature.geometry;
  let total = 0;

  if (geom.type === "Polygon") {
    geom.coordinates.forEach((ring) => {
      total += ringArea(ring);
    });
  } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach((poly) => {
      poly.forEach((ring) => {
        total += ringArea(ring);
      });
    });
  }

  return Math.abs(total);
}

const BASEMAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

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

const getKhasraNumber = (props = {}) => {
  return (
    props.kh ??
    props.KH ??
    props.k ??
    props.K ??
    props.khasra ??
    props.khasra_no ??
    props.khasra_id ??
    null
  );
};

const getMurabbaNumber = (props = {}) => {
  return (
    props.m ??
    props.M ??
    props.mn ??
    props.murabba ??
    props.murabba_no ??
    props.murabba_id ??
    null
  );
};

const getLayerVisible = (layers = {}, key, fallback = true) => {
  const value = layers?.[key];
  if (typeof value === "object") return value.visible !== false;
  if (typeof value === "boolean") return value;
  return fallback;
};

const getLayerOpacity = (layers = {}, key, fallback = 100) => {
  const value = layers?.[key];
  if (typeof value === "object" && Number.isFinite(Number(value.opacity))) {
    return Number(value.opacity);
  }
  return fallback;
};

const boundaryLevelToLayerKey = (level) => {
  if (level === "district") return "districtBoundary";
  if (level === "tehsil") return "tehsilBoundary";
  if (level === "mauza") return "mauzaBoundary";
  if (level?.startsWith?.("proposed-road")) return "proposedRoads";
  if (level?.startsWith?.("ruda")) return "rudaBoundary";
  return null;
};

const ensureTriangleIcon = (map) => {
  if (!map || map.hasImage(TRI_JUNCTION_TRIANGLE_IMAGE)) return;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.lineTo(size - 8, size - 8);
  ctx.lineTo(8, size - 8);
  ctx.closePath();

  ctx.fillStyle = "#ef4444";
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#890b0b";
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(TRI_JUNCTION_TRIANGLE_IMAGE, imageData);
};

export default function MapView({
  selectedDistrict,
  selectedTehsil,
  selectedMauza,
  viewBy,
  demarcationMode = false,
  onParcelSelect,
  layers = {},
  selectedFilterLayers = [],
  selectedRudaPhaseIds = [],
  selectedProposedRoadIds = [],
  basemap = "Streets",
  selectedFeatureNumber,
  onFeaturesLoaded,
}) {
  const mapWrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});
  const activePopupRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const lastSyncedSelectionRef = useRef("");

  const [isMapReady, setIsMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const clearProposedRoads = () => {
    try {
      Object.keys(currentGeojson.current || {})
        .filter((key) => key.startsWith("proposed-road"))
        .forEach((level) => {
          clearBoundaryLevel(level);
          delete currentGeojson.current[level];
        });
    } catch (e) {}
  };
  const closeActivePopup = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: BASEMAP_STYLES.Streets,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        preserveDrawingBuffer: true,
      });

      // Default Mapbox basemap dropdown and zoom controls removed.

      map.on("load", () => {
        setIsMapReady(true);
      });

      // Whenever a style is (re)loaded — whether via the UI control or
      // programmatic `setStyle` — restore any application layers/sources
      // that we keep in `currentGeojson.current`.
      map.on("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: "#f59e0b",
                strokeColor: "#78350f",
                radius: 5,
              });
            } else if (key === "tri-junction-points") {
              drawTriJunctionLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
              });
            } else {
              const layerKey = boundaryLevelToLayerKey(key);
              if (!layerKey || getLayerVisible(layers, layerKey, true)) {
                drawBoundaryLevel(
                  key,
                  g,
                  layerKey ? getLayerOpacity(layers, layerKey, 100) : null,
                );
              }
            }
          });
        } catch (e) {
          console.warn("Error restoring layers after style change", e);
        }
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Error initializing map");
      });

      mapInstance.current = map;

      return () => {
        closeActivePopup();

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

  useEffect(() => {
    if (!isMapReady) return;

    const loadProposedRoads = async () => {
      const map = mapInstance.current;
      if (!map) return;

      if (!getLayerVisible(layers, "proposedRoads", false)) {
        clearProposedRoads();
        return;
      }

      clearProposedRoads();

      if (!selectedProposedRoadIds?.length) return;

      try {
        setIsLoading(true);

        const allRoadsGeojson = await getRudaProposedRoadsGeoJSON();
        const selectedIds = new Set(
          selectedProposedRoadIds.map((id) => String(id))
        );

        const filteredGeojson = {
          type: "FeatureCollection",
          features: (allRoadsGeojson.features || []).filter((feature) => {
            const props = feature?.properties || {};
            const featureId =
              props.gid ??
              feature?.id ??
              props.id ??
              props.oid ??
              props.fid;

            return selectedIds.has(String(featureId));
          }),
        };

        if (!filteredGeojson.features.length) return;

        drawBoundaryLevel(
          "proposed-roads",
          filteredGeojson,
          getLayerOpacity(layers, "proposedRoads", 100)
        );

        currentGeojson.current["proposed-roads"] = filteredGeojson;
      } catch (e) {
        console.error("Proposed roads layer load error", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposedRoads();
  }, [
    isMapReady,
    layers?.proposedRoads,
    selectedProposedRoadIds,
  ]);

  const zoomToGeoJSON = (geojson, options = {}) => {
    const map = mapInstance.current;
    if (!map || !geojson?.features?.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    geojson.features.forEach((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      const traverse = (c) => {
        if (typeof c[0] === "number") {
          bounds.extend(c);
        } else {
          c.forEach(traverse);
        }
      };

      traverse(coords);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: options.padding ?? 40,
        duration: options.duration ?? 350,
        essential: true,
      });
    }
  };

  const reportLoadedFeatures = (geojson) => {
    try {
      if (typeof onFeaturesLoaded === "function") onFeaturesLoaded(geojson);
    } catch (e) {
      console.warn("onFeaturesLoaded callback failed", e);
    }
  };

const getBoundaryIds = (level) => ({
  source: `${level}-boundary-source`,
  fill: `${level}-boundary-fill`,
  line: `${level}-boundary-line`,
  dashLine: `${level}-boundary-dash-line`,
  label: `${level}-boundary-label`,
});

const clearBoundaryLevel = (level) => {
  const map = mapInstance.current;
  if (!map) return;

  const ids = getBoundaryIds(level);

  try {
    if (map.getLayer(ids.label)) map.removeLayer(ids.label);
    if (map.getLayer(ids.dashLine)) map.removeLayer(ids.dashLine);
    if (map.getLayer(ids.line)) map.removeLayer(ids.line);
    if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
    if (map.getSource(ids.source)) map.removeSource(ids.source);
  } catch (e) {
    console.warn(`Error clearing boundary level ${level}`, e);
  }
};

const drawBoundaryLevel = (level, geojson, opacityOverride = null) => {
  const map = mapInstance.current;
  if (!map) return;

  const ids = getBoundaryIds(level);
  clearBoundaryLevel(level);

  const isRudaLayer = level.startsWith("ruda");
  const isProposedRoadLayer = level.startsWith("proposed-road");

  const opacity =
    opacityOverride !== null && opacityOverride !== undefined
      ? Number(opacityOverride) / 100
      : isRudaLayer
        ? getLayerOpacity(layers, "rudaBoundary", 50) / 100
        : 0.2;

  const sourceGeojson = isRudaLayer
    ? prepareRudaGeojsonForDisplay(level, geojson)
    : geojson || emptyFeatureCollection();

  try {
    map.addSource(ids.source, {
      type: "geojson",
      data: sourceGeojson,
    });

    if (isProposedRoadLayer) {
      const roadLayerNames = getUniqueRoadLayerNames(sourceGeojson.features || []);

      map.addLayer({
        id: ids.line,
        type: "line",
        source: ids.source,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": buildRoadMatchExpression(
            roadLayerNames,
            getRoadColor,
            "#ef4444",
          ),
          "line-width": buildRoadMatchExpression(
            roadLayerNames,
            getRoadWidth,
            4,
          ),
          "line-opacity": opacity,
        },
      });

      currentGeojson.current[level] = sourceGeojson;
      return;
    }

    map.addLayer({
      id: ids.fill,
      type: "fill",
      source: ids.source,
      paint: {
        "fill-color": isRudaLayer
          ? ["coalesce", ["get", "_ruda_phase_color"], "#3d7cc4"]
          : "#0b6a2e",
        "fill-opacity": opacity,
        "fill-outline-color": isRudaLayer ? "#1f2937" : "#194c8e",
      },
    });

    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.source,
      paint: {
        "line-color": isRudaLayer ? "#111827" : "#194c8e",
        "line-width": isRudaLayer ? 2 : MAP_THEME.lineWidth,
        "line-opacity": 0.95,
      },
    });

    if (isRudaLayer) {
      map.addLayer({
        id: ids.dashLine,
        type: "line",
        source: ids.source,
        paint: {
          "line-color": "#111827",
          "line-width": 1.2,
          "line-dasharray": [1.4, 1.2],
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: ids.label,
        type: "symbol",
        source: ids.source,
        layout: {
          "text-field": ["coalesce", ["get", "_ruda_phase_label"], "RUDA Phase"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 15, 13],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#111827",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.4,
        },
      });
    }

    currentGeojson.current[level] = sourceGeojson;
  } catch (e) {
    console.error("drawBoundaryLevel error", e);
  }
};

  const clearLayerAndSource = (fillId, lineId, sourceId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (fillId && map.getLayer(fillId)) map.removeLayer(fillId);
      if (lineId && map.getLayer(lineId)) map.removeLayer(lineId);
      if (sourceId && map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing ${sourceId}`, e);
    }
  };

  const clearPointLayer = (sourceId, layerId) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      closeActivePopup();

      if (map.getLayer(layerId)) {
        map.off("click", layerId, handlePointClick);
        map.off("mouseenter", layerId, handlePointMouseEnter);
        map.off("mouseleave", layerId, handlePointMouseLeave);
        map.removeLayer(layerId);
      }

      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Error clearing point layer ${layerId}`, e);
    }
  };

  const clearCornerMarkers = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(SELECTED_CORNER_TEXT_LAYER)) {
        map.off("click", SELECTED_CORNER_TEXT_LAYER, handlePointClick);
        map.off(
          "mouseenter",
          SELECTED_CORNER_TEXT_LAYER,
          handlePointMouseEnter,
        );
        map.off(
          "mouseleave",
          SELECTED_CORNER_TEXT_LAYER,
          handlePointMouseLeave,
        );
        map.removeLayer(SELECTED_CORNER_TEXT_LAYER);
      }

      if (map.getLayer(SELECTED_CORNER_BOX_LAYER)) {
        map.removeLayer(SELECTED_CORNER_BOX_LAYER);
      }

      if (map.getLayer(SELECTED_CORNER_LAYER)) {
        map.off("click", SELECTED_CORNER_LAYER, handlePointClick);
        map.off("mouseenter", SELECTED_CORNER_LAYER, handlePointMouseEnter);
        map.off("mouseleave", SELECTED_CORNER_LAYER, handlePointMouseLeave);
        map.removeLayer(SELECTED_CORNER_LAYER);
      }

      if (map.getSource(SELECTED_CORNER_SOURCE)) {
        map.removeSource(SELECTED_CORNER_SOURCE);
      }
    } catch (e) {
      console.warn("Failed to clear corner markers", e);
    }
  };

  const clearKhasraLayers = () => {
    clearLayerAndSource(KHASRA_FILL, KHASRA_LINE, KHASRA_SOURCE);
    clearCornerMarkers();
  };

  const clearMurabbaLayers = () => {
    clearLayerAndSource(MURABBA_FILL, MURABBA_LINE, MURABBA_SOURCE);
    clearCornerMarkers();
  };

  const getFeatureLatLng = (feature, clickLngLat) => {
    const lngFromClick = clickLngLat?.lng;
    const latFromClick = clickLngLat?.lat;

    if (
      lngFromClick !== undefined &&
      lngFromClick !== null &&
      latFromClick !== undefined &&
      latFromClick !== null &&
      !Number.isNaN(Number(lngFromClick)) &&
      !Number.isNaN(Number(latFromClick))
    ) {
      return {
        lat: Number(latFromClick),
        lng: Number(lngFromClick),
      };
    }

    const geometry = feature?.geometry;
    const coords = geometry?.coordinates;

    if (
      geometry?.type === "Point" &&
      Array.isArray(coords) &&
      coords.length >= 2 &&
      !Number.isNaN(Number(coords[0])) &&
      !Number.isNaN(Number(coords[1]))
    ) {
      return {
        lat: Number(coords[1]),
        lng: Number(coords[0]),
      };
    }

    return { lat: null, lng: null };
  };

  const formatCoordinate = (value) => {
    const num = Number(value);
    if (value === null || value === undefined || Number.isNaN(num)) return "-";
    return num.toFixed(6);
  };

  const buildMinimalPopupHtml = (
    props = {},
    coordinates = { lat: null, lng: null },
  ) => {
    const isControlPoint = props.type === "B";
    const isTriJunction = props.type === "TJ";

    const coordinatesHtml = `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #d1d5db;">
        <div><span style="font-weight: 600;">Latitude:</span> ${formatCoordinate(coordinates.lat)}</div>
        <div><span style="font-weight: 600;">Longitude:</span> ${formatCoordinate(coordinates.lng)}</div>
      </div>
    `;

    if (isControlPoint) {
      return `
        <div style="min-width: 180px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #1f2937;">
          <div style="font-size: 13px; font-weight: 700; color: #158033; margin-bottom: 6px;">
            Control Point
          </div>
          <div>
            <span style="font-weight: 600;">Type:</span> Burji
          </div>
          ${coordinatesHtml}
        </div>
      `;
    }

    if (isTriJunction) {
      return `
        <div style="min-width: 220px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937;">
          <div style="font-size: 13px; font-weight: 700; color: #158033; margin-bottom: 6px;">
            Tri-junction Point
          </div>
          <div><span style="font-weight: 600;">Mauza 1:</span> ${props.m1 ?? "-"}</div>
          <div><span style="font-weight: 600;">Mauza 2:</span> ${props.m2 ?? "-"}</div>
          <div><span style="font-weight: 600;">Mauza 3:</span> ${props.m3 ?? "-"}</div>
          ${coordinatesHtml}
        </div>
      `;
    }

    return `
      <div style="min-width: 160px; font-family: Arial, sans-serif; font-size: 12px; color: #1f2937;">
        <div style="font-size: 13px; font-weight: 700; color: #158033; margin-bottom: 6px;">
          Point
        </div>
        <div>No details available</div>
        ${coordinatesHtml}
      </div>
    `;
  };

  function handlePointMouseEnter() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "pointer";
  }

  function handlePointMouseLeave() {
    const map = mapInstance.current;
    if (!map) return;
    map.getCanvas().style.cursor = "";
  }

  function handlePointClick(e) {
    const map = mapInstance.current;
    if (!map) return;

    const feature = e.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coordinates = getFeatureLatLng(feature, e.lngLat);

    const html = buildMinimalPopupHtml(props, coordinates);

    closeActivePopup();

    const popup = new mapboxgl.Popup({
      offset: 10,
      maxWidth: "260px",
      closeButton: true,
      closeOnClick: false,
    })
      .setLngLat(
        e.lngLat ||
          (coordinates.lng != null && coordinates.lat != null
            ? [coordinates.lng, coordinates.lat]
            : [DEFAULT_CENTER[0], DEFAULT_CENTER[1]]),
      )
      .setHTML(html)
      .addTo(map);

    activePopupRef.current = popup;

    popupTimeoutRef.current = setTimeout(() => {
      if (activePopupRef.current === popup) {
        popup.remove();
        activePopupRef.current = null;
      }
      popupTimeoutRef.current = null;
    }, 6000);

    popup.on("close", () => {
      if (activePopupRef.current === popup) {
        activePopupRef.current = null;
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    });
  }

  const drawPointLayer = ({
    sourceId,
    layerId,
    geojson,
    color,
    strokeColor,
    radius,
  }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearPointLayer(sourceId, layerId);

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    try {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": radius,
          "circle-color": color,
          "circle-stroke-width": 2,
          "circle-stroke-color": strokeColor,
          "circle-opacity": 0.95,
        },
      });

      map.on("mouseenter", layerId, handlePointMouseEnter);
      map.on("mouseleave", layerId, handlePointMouseLeave);
      map.on("click", layerId, handlePointClick);
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const bringTriJunctionToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      if (map.getLayer(TRI_JUNCTION_POINTS_LAYER)) {
        map.moveLayer(TRI_JUNCTION_POINTS_LAYER);
      }
    } catch (e) {
      console.warn("Could not move tri-junction layer to top", e);
    }
  };

  const drawTriJunctionLayer = ({ sourceId, layerId, geojson }) => {
    const map = mapInstance.current;
    if (!map) return;

    clearPointLayer(sourceId, layerId);

    if (!geojson?.features || !Array.isArray(geojson.features)) return;

    try {
      ensureTriangleIcon(map);

      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: layerId,
        type: "symbol",
        source: sourceId,
        layout: {
          "icon-image": TRI_JUNCTION_TRIANGLE_IMAGE,
          "icon-size": 0.55,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.moveLayer(layerId);

      map.on("mouseenter", layerId, handlePointMouseEnter);
      map.on("mouseleave", layerId, handlePointMouseLeave);
      map.on("click", layerId, handlePointClick);
    } catch (e) {
      console.error(`Failed to draw ${layerId}`, e);
    }
  };

  const addCornerMarkers = (map, feature) => {
    try {
      clearCornerMarkers();

      const geom = feature.geometry;
      let coords = [];

      if (geom.type === "Polygon") {
        coords = geom.coordinates?.[0] || [];
      } else if (geom.type === "MultiPolygon") {
        coords = geom.coordinates?.[0]?.[0] || [];
      }

      if (coords.length > 1) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          coords = coords.slice(0, coords.length - 1);
        }
      }

      const cornerFeatures = coords.slice(0, 4).map((c, idx) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c[0], c[1]] },
        properties: { idx, label: String.fromCharCode(65 + idx) },
      }));

      const cornerFc = {
        type: "FeatureCollection",
        features: cornerFeatures,
      };

      map.addSource(SELECTED_CORNER_SOURCE, {
        type: "geojson",
        data: cornerFc,
      });

      if (demarcationMode) {
        map.addLayer({
          id: SELECTED_CORNER_BOX_LAYER,
          type: "symbol",
          source: SELECTED_CORNER_SOURCE,
          layout: {
            "text-field": "■",
            "text-size": 45,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#000000",
          },
        });

        map.addLayer({
          id: SELECTED_CORNER_TEXT_LAYER,
          type: "symbol",
          source: SELECTED_CORNER_SOURCE,
          layout: {
            "text-field": ["get", "label"],
            "text-size": 18,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });
      } else {
        map.addLayer({
          id: SELECTED_CORNER_LAYER,
          type: "circle",
          source: SELECTED_CORNER_SOURCE,
          paint: {
            "circle-radius": 6,
            "circle-color": "#111827",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }

      function cornerClickHandler(e) {
        const lngLat = e.lngLat;
        closeActivePopup();

        const html = `<div style="font-family: Arial, sans-serif; font-size:12px;"><div style="font-weight:600">Corner</div><div>Lat: ${formatCoordinate(lngLat.lat)}</div><div>Lng: ${formatCoordinate(lngLat.lng)}</div></div>`;

        const popup = new mapboxgl.Popup({
          offset: 8,
          closeButton: false,
          closeOnClick: false,
        })
          .setLngLat([lngLat.lng, lngLat.lat])
          .setHTML(html)
          .addTo(map);

        activePopupRef.current = popup;

        popupTimeoutRef.current = setTimeout(() => {
          if (activePopupRef.current === popup) {
            popup.remove();
            activePopupRef.current = null;
          }
          popupTimeoutRef.current = null;
        }, 3000);

        popup.on("close", () => {
          if (activePopupRef.current === popup) activePopupRef.current = null;
          if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
          }
        });
      }

      const activeCornerLayer = demarcationMode
        ? SELECTED_CORNER_TEXT_LAYER
        : SELECTED_CORNER_LAYER;

      map.on("click", activeCornerLayer, cornerClickHandler);
      map.on("mouseenter", activeCornerLayer, handlePointMouseEnter);
      map.on("mouseleave", activeCornerLayer, handlePointMouseLeave);
    } catch (e) {
      console.warn("Failed to add corner markers", e);
    }
  };

  const ensureSelectedLayers = (map) => {
    if (!map.getSource(SELECTED_SOURCE)) {
      map.addSource(SELECTED_SOURCE, {
        type: "geojson",
        data: emptyFeatureCollection(),
      });
    }

    if (!map.getLayer(SELECTED_FILL)) {
      map.addLayer({
        id: SELECTED_FILL,
        type: "fill",
        source: SELECTED_SOURCE,
        paint: {
          "fill-color": "#FFD54F",
          "fill-opacity": 0.7,
        },
      });
    }

    if (!map.getLayer(SELECTED_LINE)) {
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
  };

  const drawKhasras = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearKhasraLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

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
          "fill-opacity": getLayerOpacity(layers, "khasraLayer", 100) / 100,
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

      currentGeojson.current.khasra = geojson;

      ensureSelectedLayers(map);

      map.off("click", KHASRA_FILL);
      map.off("mouseenter", KHASRA_FILL);
      map.off("mouseleave", KHASRA_FILL);

      map.on("click", KHASRA_FILL, (e) => {
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
            cloned.properties._layerType = "khasra";
            onParcelSelect(cloned);
          }

          addCornerMarkers(map, feature);
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
      reportLoadedFeatures(geojson);
    } catch (e) {
      console.error("Khasra drawing error:", e);
      setError("Failed to display Khasras");
    }
  };

  const drawMurabbas = (geojson) => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      clearMurabbaLayers();

      try {
        const sel = map.getSource(SELECTED_SOURCE);
        if (sel) sel.setData(emptyFeatureCollection());
      } catch (err) {}

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
          "fill-opacity": getLayerOpacity(layers, "murabbaLayer", 100) / 100,
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

      currentGeojson.current.murabba = geojson;

      ensureSelectedLayers(map);

      map.off("click", MURABBA_FILL);
      map.off("mouseenter", MURABBA_FILL);
      map.off("mouseleave", MURABBA_FILL);

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

          addCornerMarkers(map, feature);
        }
      });

      map.on("mouseenter", MURABBA_FILL, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", MURABBA_FILL, () => {
        map.getCanvas().style.cursor = "";
      });

      zoomToGeoJSON(geojson);
      setFeatureCount(geojson.features.length);
      reportLoadedFeatures(geojson);
    } catch (e) {
      console.error("Murabba drawing error:", e);
      setError("Failed to display Murabbas");
    }
  };

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadBoundary = async () => {
      try {
        setIsLoading(true);
        setError("");

        ["district", "tehsil", "mauza"].forEach((lvl) =>
          clearBoundaryLevel(lvl),
        );

        setFeatureCount(0);

        const loadedGeojsons = [];

        if (selectedDistrict?.length) {
          const geojsons = await Promise.all(
            selectedDistrict.map((d) => getDistrictBoundary(d.id || d)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            currentGeojson.current.district = merged;
            loadedGeojsons.push(merged);

            if (getLayerVisible(layers, "districtBoundary", true)) {
              drawBoundaryLevel(
                "district",
                merged,
                getLayerOpacity(layers, "districtBoundary", 100),
              );
            }
          }
        }

        if (selectedTehsil?.length) {
          const geojsons = await Promise.all(
            selectedTehsil.map((t) => getTehsilBoundary(t.id || t)),
          );
          if (cancelled) return;

          const merged = mergeFeatureCollections(geojsons);
          if (merged?.features?.length) {
            currentGeojson.current.tehsil = merged;
            loadedGeojsons.push(merged);

            if (getLayerVisible(layers, "tehsilBoundary", true)) {
              drawBoundaryLevel(
                "tehsil",
                merged,
                getLayerOpacity(layers, "tehsilBoundary", 100),
              );
            }
          }
        }

        if (selectedMauza) {
          const mauzaId =
            selectedMauza.mauza_id || selectedMauza.id || selectedMauza;

          const geojson = await getMauzaBoundary(mauzaId);
          if (cancelled) return;

          if (geojson?.features?.length) {
            currentGeojson.current.mauza = geojson;
            loadedGeojsons.push(geojson);

            if (getLayerVisible(layers, "mauzaBoundary", true)) {
              drawBoundaryLevel(
                "mauza",
                geojson,
                getLayerOpacity(layers, "mauzaBoundary", 100),
              );
            }
          }
        }

        const zoomTarget = loadedGeojsons[loadedGeojsons.length - 1];
        if (zoomTarget?.features?.length) {
          zoomToGeoJSON(zoomTarget);
          setFeatureCount(zoomTarget.features.length);
        }

      } catch (e) {
        if (!cancelled) {
          console.error("Boundary load error:", e);
          setError("Failed to load boundary");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBoundary();

    return () => {
      cancelled = true;
    };
  }, [
      selectedDistrict,
    selectedTehsil,
    selectedMauza,
    isMapReady,
    layers?.districtBoundary,
    layers?.tehsilBoundary,
    layers?.mauzaBoundary,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const styleUrl = BASEMAP_STYLES[basemap] || basemap;
    if (!styleUrl) return;

    try {
      map.setStyle(styleUrl);

      map.once("style.load", () => {
        try {
          Object.keys(currentGeojson.current || {}).forEach((key) => {
            const g = currentGeojson.current[key];
            if (!g) return;

            if (key === "khasra") {
              drawKhasras(g);
            } else if (key === "murabba") {
              drawMurabbas(g);
            } else if (key === "control-points") {
              drawPointLayer({
                sourceId: CONTROL_POINTS_SOURCE,
                layerId: CONTROL_POINTS_LAYER,
                geojson: g,
                color: "#f59e0b",
                strokeColor: "#78350f",
                radius: 5,
              });
            } else if (key === "tri-junction-points") {
              drawTriJunctionLayer({
                sourceId: TRI_JUNCTION_POINTS_SOURCE,
                layerId: TRI_JUNCTION_POINTS_LAYER,
                geojson: g,
              });
            } else {
              const layerKey = boundaryLevelToLayerKey(key);
              if (!layerKey || getLayerVisible(layers, layerKey, true)) {
                drawBoundaryLevel(
                  key,
                  g,
                  layerKey ? getLayerOpacity(layers, layerKey, 100) : null,
                );
              }
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

  useEffect(() => {
    lastSyncedSelectionRef.current = "";
  }, [selectedMauza, viewBy]);

  useEffect(() => {
    if (!isMapReady || !selectedFeatureNumber) return;

    const map = mapInstance.current;
    if (!map) return;

    const selectionKey =
      typeof selectedFeatureNumber === "object"
        ? JSON.stringify(selectedFeatureNumber)
        : String(selectedFeatureNumber);

    if (lastSyncedSelectionRef.current === selectionKey) return;

    const current =
      viewBy === "khasra"
        ? currentGeojson.current.khasra
        : viewBy === "murabba"
          ? currentGeojson.current.murabba
          : currentGeojson.current.khasra ||
            currentGeojson.current.murabba ||
            {};

    const features = Array.isArray(current?.features) ? current.features : [];

    const matched = features.find((feat) => {
      const p = feat?.properties || {};

      if (
        viewBy === "khasra" &&
        typeof selectedFeatureNumber === "object" &&
        selectedFeatureNumber !== null
      ) {
        const murabba = getMurabbaNumber(p);
        const khasra = getKhasraNumber(p);

        return (
          String(murabba) === String(selectedFeatureNumber.murabbaNo) &&
          String(khasra) === String(selectedFeatureNumber.khasraNo)
        );
      }

      const cand =
        viewBy === "khasra"
          ? getKhasraNumber(p)
          : viewBy === "murabba"
            ? getMurabbaNumber(p)
            : feat?.id;

      return String(cand) === String(selectedFeatureNumber);
    });

    if (matched) {
      const selectedGeo = { type: "FeatureCollection", features: [matched] };

      try {
        ensureSelectedLayers(map);
        map.getSource(SELECTED_SOURCE).setData(selectedGeo);
        zoomToGeoJSON(selectedGeo, { padding: 80, duration: 450 });
        addCornerMarkers(map, matched);
        lastSyncedSelectionRef.current = selectionKey;
      } catch (e) {
        console.warn("Could not highlight selected parcel", e);
      }
    }
  }, [selectedFeatureNumber, viewBy, isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;

    const loadRuda = async () => {
      const clearRudaLevels = () => {
        try {
          Object.keys(currentGeojson.current || {})
            .filter((key) => key.startsWith("ruda-"))
            .forEach((level) => {
              clearBoundaryLevel(level);
              delete currentGeojson.current[level];
            });
        } catch (e) {}
      };

      if (!getLayerVisible(layers, "rudaBoundary", false)) {
        clearRudaLevels();
        return;
      }

      clearRudaLevels();

      if (!selectedRudaPhaseIds?.length) return;

      try {
        setIsLoading(true);

        const results = await Promise.all(
          selectedRudaPhaseIds.map((gid) =>
            getRudaGeoJSON(gid)
              .then((geojson) => ({ gid, geojson }))
              .catch((e) => {
                console.error("RUDA geojson error", e);
                return null;
              }),
          ),
        );

        results.filter(Boolean).forEach((item) => {
          drawBoundaryLevel(
            `ruda-${item.gid}`,
            item.geojson,
            getLayerOpacity(layers, "rudaBoundary", 50),
          );
          currentGeojson.current[`ruda-${item.gid}`] = item.geojson;
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRuda();
  }, [isMapReady, layers?.rudaBoundary, selectedRudaPhaseIds]);

  useEffect(() => {
    if (
      !selectedMauza ||
      !isMapReady ||
      viewBy !== "khasra" ||
      !getLayerVisible(layers, "khasraLayer", true)
    ) {
      clearKhasraLayers();
      delete currentGeojson.current.khasra;
      return;
    }

    const loadKhasras = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mauzaId =
          selectedMauza.mauza_id || selectedMauza.id || selectedMauza;

        const geojson = await getKhasras(mauzaId);

        if (geojson?.features?.length) {
          drawKhasras(geojson);
        } else {
          clearKhasraLayers();
          delete currentGeojson.current.khasra;
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
  }, [selectedMauza, isMapReady, viewBy, layers?.khasraLayer]);

  useEffect(() => {
    if (
      !selectedMauza ||
      !isMapReady ||
      viewBy !== "murabba" ||
      !getLayerVisible(layers, "murabbaLayer", true)
    ) {
      clearMurabbaLayers();
      delete currentGeojson.current.murabba;
      return;
    }

    const loadMurabbas = async () => {
      try {
        setIsLoading(true);
        setError("");

        const mauzaId =
          selectedMauza.mauza_id || selectedMauza.id || selectedMauza;

        const geojson = await getMurabbas(mauzaId);

        if (geojson?.features?.length) {
          drawMurabbas(geojson);
        } else {
          clearMurabbaLayers();
          delete currentGeojson.current.murabba;
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
  }, [selectedMauza, isMapReady, viewBy, layers?.murabbaLayer]);

  useEffect(() => {
    if (!isMapReady) return;

    const mauzaName =
      typeof selectedMauza === "object"
        ? selectedMauza?.mauza?.trim?.() || ""
        : "";

    const loadPoints = async () => {
      try {
        const normalizedMauza = (mauzaName || "").trim().toLowerCase();

        if (getLayerVisible(layers, "controlPoints", false) && normalizedMauza) {
          const controlGeojson = await getTrijunctionPoints({
            mauza: mauzaName,
            type: "B",
          });

          const filteredControlGeojson = {
            type: "FeatureCollection",
            features: (controlGeojson?.features || []).filter((feature) => {
              const m3Value = String(feature?.properties?.m3 || "")
                .trim()
                .toLowerCase();
              return m3Value === normalizedMauza;
            }),
          };

          if (filteredControlGeojson.features.length) {
            drawPointLayer({
              sourceId: CONTROL_POINTS_SOURCE,
              layerId: CONTROL_POINTS_LAYER,
              geojson: filteredControlGeojson,
              color: "#f59e0b",
              strokeColor: "#78350f",
              radius: 5,
            });
            currentGeojson.current["control-points"] = filteredControlGeojson;
          } else {
            clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
            delete currentGeojson.current["control-points"];
          }
        } else {
          clearPointLayer(CONTROL_POINTS_SOURCE, CONTROL_POINTS_LAYER);
          delete currentGeojson.current["control-points"];
        }

        if (getLayerVisible(layers, "triJunctionPoints", false) && normalizedMauza) {
          const trijunctionGeojson = await getTrijunctionPoints({
            mauza: mauzaName,
            type: "TJ",
          });

          const filteredTriJunctionGeojson = {
            type: "FeatureCollection",
            features: (trijunctionGeojson?.features || []).filter((feature) => {
              const m3Value = String(feature?.properties?.m3 || "")
                .trim()
                .toLowerCase();
              return m3Value === normalizedMauza;
            }),
          };

          if (filteredTriJunctionGeojson.features.length) {
            drawTriJunctionLayer({
              sourceId: TRI_JUNCTION_POINTS_SOURCE,
              layerId: TRI_JUNCTION_POINTS_LAYER,
              geojson: filteredTriJunctionGeojson,
            });
            currentGeojson.current["tri-junction-points"] =
              filteredTriJunctionGeojson;
          } else {
            clearPointLayer(
              TRI_JUNCTION_POINTS_SOURCE,
              TRI_JUNCTION_POINTS_LAYER,
            );
            delete currentGeojson.current["tri-junction-points"];
          }
        } else {
          clearPointLayer(
            TRI_JUNCTION_POINTS_SOURCE,
            TRI_JUNCTION_POINTS_LAYER,
          );
          delete currentGeojson.current["tri-junction-points"];
        }
      } catch (e) {
        console.error("Failed to load trijunction points:", e);
        setError("Failed to load control / tri-junction points");
      }
    };

    loadPoints();
  }, [
    isMapReady,
    selectedMauza,
    layers?.controlPoints,
    layers?.triJunctionPoints,
  ]);

  return (
    <div ref={mapWrapperRef} className="absolute inset-0 w-full h-full bg-white">
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      />

      <MapControls
        map={isMapReady ? mapInstance.current : null}
        fullscreenTargetRef={mapWrapperRef}
      />

      {error && (
        <div className="absolute top-5 left-5 bg-red-500 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute top-5 right-24 z-50 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Loading...
        </div>
      )}
    </div>
  );
}
