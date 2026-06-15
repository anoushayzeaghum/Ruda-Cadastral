import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

import Header from "./Header";
import MapControls from "./MapControls";

import {
  getDistrictBoundary,
  getTehsilBoundary,
  getMauzaBoundary,
  getKhasras,
  getMurabbas,
  getSquares,
  getAcres,
  getFieldPoints,
  getRudaGeoJSON,
  getRudaProposedRoadsGeoJSON,
  getGeodeticNetworkGeoJSON,
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

const SQUARE_LEVEL = "square";
const ACRE_LEVEL = "acre";

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

const FIELD_POINTS_SOURCE = "field-points-source";
const FIELD_POINTS_LAYER = "field-points-layer";

const GEODETIC_NETWORK_SOURCE = "geodetic-network-source";
const GEODETIC_NETWORK_LAYER = "geodetic-network-layer";

const DSM_SOURCE = "local-dsm-source";
const DSM_LAYER = "local-dsm-layer";
const DTM_SOURCE = "local-dtm-source";
const DTM_LAYER = "local-dtm-layer";
const ORTHO_SOURCE = "local-ortho-source";
const ORTHO_LAYER = "local-ortho-layer";

const AS_BUILT_JAN_2023_SOURCE = "local-asbuilt-jan2023-source";
const AS_BUILT_JAN_2023_LAYER = "local-asbuilt-jan2023-layer";
const ORTHO_JUNE_2023_SOURCE = "local-ortho-june2023-source";
const ORTHO_JUNE_2023_LAYER = "local-ortho-june2023-layer";
const ORTHO_NOV_2024_SOURCE = "local-ortho-nov2024-source";
const ORTHO_NOV_2024_LAYER = "local-ortho-nov2024-layer";
const HANDU_GUJRAN_ORTHO_SOURCE = "local-handugujran-ortho-source";
const HANDU_GUJRAN_ORTHO_LAYER = "local-handugujran-ortho-layer";

const MEASURE_SOURCE = "measure-source";
const MEASURE_LINE_LAYER = "measure-line-layer";
const MEASURE_POINTS_LAYER = "measure-points-layer";
const MEASURE_LABELS_LAYER = "measure-labels-layer";

const MEASURE_AREA_SOURCE = "measure-area-source";
const MEASURE_AREA_FILL_LAYER = "measure-area-fill-layer";
const MEASURE_AREA_LINE_LAYER = "measure-area-line-layer";
const MEASURE_AREA_POINTS_LAYER = "measure-area-points-layer";
const MEASURE_AREA_LABEL_LAYER = "measure-area-label-layer";

const BEARING_SOURCE = "bearing-source";
const BEARING_LINE_LAYER = "bearing-line-layer";
const BEARING_POINTS_LAYER = "bearing-points-layer";
const BEARING_LABEL_LAYER = "bearing-label-layer";

const BUFFER_SOURCE = "buffer-source";
const BUFFER_FILL_LAYER = "buffer-fill-layer";
const BUFFER_LINE_LAYER = "buffer-line-layer";
const BUFFER_CENTER_LAYER = "buffer-center-layer";

const MAP_THEME = {
  fillColor: "#158033",
  fillOpacity: 0.2,
  lineColor: "#1e3a5f",
  lineWidth: 2,
};

const ROAD_LEGEND_ITEMS = [
  { label: "Primary Roads (300'-Wide)", color: "#19598d", width: 3 },
  { label: "Secondary Road (200'-Wide)", color: "#4caf50", width: 3 },
  { label: "Tertiary Roads", color: "#ff9800", width: 3 },
  { label: "Tertiary Roads (80'-Wide)", color: "#ff5722", width: 2.5 },
  { label: "Uti Walk Cycle", color: "#8bc34a", width: 2 },
  { label: "Bridge", color: "#75008a", width: 5 },
  { label: "300' CL", color: "#9b2400", width: 2 },
  { label: "300' ROW", color: "#00bcd4", width: 2.5 },
];

const ROAD_COLOR_EXPRESSION = [
  "match",
  ["get", "layer"],
  ...ROAD_LEGEND_ITEMS.flatMap((item) => [item.label, item.color]),
  "#555555",
];

const ROAD_WIDTH_EXPRESSION = [
  "match",
  ["get", "layer"],
  ...ROAD_LEGEND_ITEMS.flatMap((item) => [item.label, item.width]),
  2.5,
];

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

const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

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

const normalizeRoadLayerName = (value) => String(value ?? "").trim();

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

const getLayerForceLoad = (layers = {}, key) => {
  const value = layers?.[key];
  return typeof value === "object" ? !!value.forceLoad : false;
};

const boundaryLevelToLayerKey = (level) => {
  if (level === "district") return "districtBoundary";
  if (level === "tehsil") return "tehsilBoundary";
  if (level === "mauza") return "mauzaBoundary";
  if (level === SQUARE_LEVEL) return "squareLayer";
  if (level === ACRE_LEVEL) return "acreLayer";
  if (level?.startsWith?.("proposed-road")) return "proposedRoads";
  if (level?.startsWith?.("ruda")) return "rudaBoundary";
  return null;
};




const pointBelongsToMauza = (feature, selectedMauza) => {
  if (!feature || !selectedMauza) return false;

  const props = feature.properties || {};
  const mauzaName = String(
    selectedMauza?.mauza || selectedMauza?.name || selectedMauza || "",
  )
    .trim()
    .toLowerCase();
  const mauzaId = selectedMauza?.mauza_id ?? selectedMauza?.id ?? null;
  const mauzaIdText = mauzaId === null || mauzaId === undefined ? "" : String(mauzaId);

  const names = [props.m1, props.m2, props.m3]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const ids = [props.m1_id, props.m2_id, props.m3_id]
    .map((value) => (value === null || value === undefined ? "" : String(value)))
    .filter(Boolean);

  return (
    (!!mauzaName && names.includes(mauzaName)) ||
    (!!mauzaIdText && ids.includes(mauzaIdText))
  );
};

const filterPointGeoJSONByArea = (pointGeojson, areaGeojson) => {
  const points = Array.isArray(pointGeojson?.features) ? pointGeojson.features : [];
  const polygons = (areaGeojson?.features || []).filter((feature) =>
    ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type),
  );

  if (!points.length || !polygons.length) {
    return emptyFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: points.filter((pointFeature) => {
      if (pointFeature?.geometry?.type !== "Point") return false;

      return polygons.some((polygonFeature) => {
        try {
          return turf.booleanPointInPolygon(pointFeature, polygonFeature);
        } catch (e) {
          return false;
        }
      });
    }),
  };
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
  onMapReady,
}) {
  const mapWrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentGeojson = useRef({});
  const activePopupRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const lastSyncedSelectionRef = useRef("");
  const prevDsmVisible = useRef(false);
  const prevDtmVisible = useRef(false);
  const prevOrthoVisible = useRef(false);
  const prevAsBuiltJan2023Visible = useRef(false);
  const prevOrthoJune2023Visible = useRef(false);
  const prevOrthoNov2024Visible = useRef(false);
  const prevHanduGujranOrthoVisible = useRef(false);
  const measureCoordsRef = useRef([]);
  const measureAreaCoordsRef = useRef([]);
  const bearingCoordsRef = useRef([]);
  const coordPickerPopupRef = useRef(null);

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

  const movePointLayersToTop = () => {
    const map = mapInstance.current;
    if (!map) return;

    [
      CONTROL_POINTS_LAYER,
      TRI_JUNCTION_POINTS_LAYER,
      FIELD_POINTS_LAYER,
      GEODETIC_NETWORK_LAYER,
      SELECTED_CORNER_LAYER,
      SELECTED_CORNER_BOX_LAYER,
      SELECTED_CORNER_TEXT_LAYER,
    ].forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      } catch (e) {}
    });
  };

  const getOpenAreaGeoJSON = () => {
    const selectedArea = currentGeojson.current?.["selected-area"];
    if (selectedArea?.features?.length) return selectedArea;

    const mauzaArea = currentGeojson.current?.mauza;
    if (mauzaArea?.features?.length) return mauzaArea;

    const khasraArea = currentGeojson.current?.khasra;
    if (khasraArea?.features?.length) return khasraArea;

    const murabbaArea = currentGeojson.current?.murabba;
    if (murabbaArea?.features?.length) return murabbaArea;

    return null;
  };

  const resolveOpenAreaGeoJSON = async () => {
    const currentArea = getOpenAreaGeoJSON();
    if (currentArea?.features?.length) return currentArea;

    if (!selectedMauza) return null;

    try {
      const mauzaId = selectedMauza.mauza_id || selectedMauza.id || selectedMauza;
      const mauzaGeojson = await getMauzaBoundary(mauzaId);

      if (mauzaGeojson?.features?.length) {
        currentGeojson.current.mauza = mauzaGeojson;
        return mauzaGeojson;
      }
    } catch (e) {
      console.warn("Could not resolve open area for point filtering", e);
    }

    return null;
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

      // Add standard GIS controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right"
      );
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" }), "bottom-right");
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
            } else if (key === "field-points") {
              drawPointLayer({
                sourceId: FIELD_POINTS_SOURCE,
                layerId: FIELD_POINTS_LAYER,
                geojson: g,
                color: "#2563eb",
                strokeColor: "#ffffff",
                radius: 4.5,
                opacity: getLayerOpacity(layers, "fieldPoints", 100) / 100,
              });
            } else if (key === "geodetic-network") {
              drawPointLayer({
                sourceId: GEODETIC_NETWORK_SOURCE,
                layerId: GEODETIC_NETWORK_LAYER,
                geojson: g,
                color: "#dc2626",
                strokeColor: "#ffffff",
                radius: 6,
                opacity: getLayerOpacity(layers, "geodeticNetwork", 100) / 100,
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
          selectedProposedRoadIds.map((id) => String(id)),
        );

        const filteredGeojson = {
          type: "FeatureCollection",
          features: (allRoadsGeojson.features || [])
            .filter((feature) => {
              const props = feature?.properties || {};
              const featureId =
                props.gid ?? feature?.id ?? props.id ?? props.oid ?? props.fid;

              return selectedIds.has(String(featureId));
            })
            .map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                layer: normalizeRoadLayerName(feature?.properties?.layer),
              },
            })),
        };

        if (!filteredGeojson.features.length) return;

        drawBoundaryLevel(
          "proposed-roads",
          filteredGeojson,
          getLayerOpacity(layers, "proposedRoads", 100),
        );

        currentGeojson.current["proposed-roads"] = filteredGeojson;
        zoomToGeoJSON(filteredGeojson, { padding: 70, duration: 500 });
        movePointLayersToTop();
      } catch (e) {
        console.error("Proposed roads layer load error", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposedRoads();
  }, [isMapReady, layers?.proposedRoads, selectedProposedRoadIds]);

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
        map.addLayer({
          id: ids.line,
          type: "line",
          source: ids.source,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": ROAD_COLOR_EXPRESSION,
            "line-width": ROAD_WIDTH_EXPRESSION,
            "line-opacity": opacity,
          },
        });

        currentGeojson.current[level] = sourceGeojson;
        movePointLayersToTop();
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
            "text-field": [
              "coalesce",
              ["get", "_ruda_phase_label"],
              "RUDA Phase",
            ],
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
      movePointLayersToTop();
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
    const isFieldPoint = props._layerType === "fieldPoints";
    const isGeodeticPoint = props._layerType === "geodeticNetwork";

    const coordinatesHtml = `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #d1d5db;">
        <div><span style="font-weight: 600;">Latitude:</span> ${formatCoordinate(coordinates.lat)}</div>
        <div><span style="font-weight: 600;">Longitude:</span> ${formatCoordinate(coordinates.lng)}</div>
      </div>
    `;

    if (isGeodeticPoint) {
      return `
        <div style="min-width: 220px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937;">
          <div style="font-size: 13px; font-weight: 700; color: #158033; margin-bottom: 6px;">
            Geodetic Network
          </div>
          <div><span style="font-weight: 600;">Name:</span> ${props.name ?? "-"}</div>
          <div><span style="font-weight: 600;">Code:</span> ${props.code ?? "-"}</div>
          <div><span style="font-weight: 600;">Elevation:</span> ${props.elevation ?? "-"}</div>
          ${coordinatesHtml}
        </div>
      `;
    }

    if (isFieldPoint) {
      return `
        <div style="min-width: 220px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937;">
          <div style="font-size: 13px; font-weight: 700; color: #158033; margin-bottom: 6px;">
            Field Point
          </div>
          <div><span style="font-weight: 600;">Name:</span> ${props.name ?? "-"}</div>
          <div><span style="font-weight: 600;">Code:</span> ${props.code ?? "-"}</div>
          <div><span style="font-weight: 600;">GM Type:</span> ${props.gm_type ?? "-"}</div>
          <div><span style="font-weight: 600;">Elevation:</span> ${props.elevation ?? "-"}</div>
          ${coordinatesHtml}
        </div>
      `;
    }

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
    opacity = 0.95,
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
          "circle-opacity": opacity,
        },
      });

      map.on("mouseenter", layerId, handlePointMouseEnter);
      map.on("mouseleave", layerId, handlePointMouseLeave);
      map.on("click", layerId, handlePointClick);

      movePointLayersToTop();
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
      movePointLayersToTop();

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
      "fill-color": "#ffffff",
      "fill-opacity": 0.9,
    },
  });
}

if (!map.getLayer(SELECTED_LINE)) {
  map.addLayer({
    id: SELECTED_LINE,
    type: "line",
    source: SELECTED_SOURCE,
    paint: {
      "line-color": "#004225",
      "line-width": 3,
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

          currentGeojson.current["selected-area"] = selectedGeo;

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
      movePointLayersToTop();
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

          currentGeojson.current["selected-area"] = selectedGeo;

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
      movePointLayersToTop();
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
            } else if (key === "field-points") {
              drawPointLayer({
                sourceId: FIELD_POINTS_SOURCE,
                layerId: FIELD_POINTS_LAYER,
                geojson: g,
                color: "#2563eb",
                strokeColor: "#ffffff",
                radius: 4.5,
                opacity: getLayerOpacity(layers, "fieldPoints", 100) / 100,
              });
            } else if (key === "geodetic-network") {
              drawPointLayer({
                sourceId: GEODETIC_NETWORK_SOURCE,
                layerId: GEODETIC_NETWORK_LAYER,
                geojson: g,
                color: "#dc2626",
                strokeColor: "#ffffff",
                radius: 6,
                opacity: getLayerOpacity(layers, "geodeticNetwork", 100) / 100,
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
    delete currentGeojson.current["selected-area"];
  }, [selectedMauza, viewBy]);

  useEffect(() => {
    if (!isMapReady) return;

    const map = mapInstance.current;
    if (!map) return;

    if (!selectedFeatureNumber) {
      lastSyncedSelectionRef.current = "";
      delete currentGeojson.current["selected-area"];

      try {
        ensureSelectedLayers(map);
        const src = map.getSource(SELECTED_SOURCE);
        if (src) src.setData(emptyFeatureCollection());
      } catch (e) {
        console.warn("Could not clear selected parcel", e);
      }

      clearCornerMarkers();
      return;
    }

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
        currentGeojson.current["selected-area"] = selectedGeo;
        ensureSelectedLayers(map);
        map.getSource(SELECTED_SOURCE).setData(selectedGeo);
        zoomToGeoJSON(selectedGeo, { padding: 80, duration: 450 });
        addCornerMarkers(map, matched);
        lastSyncedSelectionRef.current = selectionKey;
      } catch (e) {
        console.warn("Could not highlight selected parcel", e);
      }
    }
  }, [selectedFeatureNumber, viewBy, isMapReady, featureCount]);

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

        const loadedRudaGeojsons = results
          .filter(Boolean)
          .map((item) => item.geojson)
          .filter((geojson) => geojson?.features?.length);

        results.filter(Boolean).forEach((item) => {
          drawBoundaryLevel(
            `ruda-${item.gid}`,
            item.geojson,
            getLayerOpacity(layers, "rudaBoundary", 50),
          );
          currentGeojson.current[`ruda-${item.gid}`] = item.geojson;
        });

        if (loadedRudaGeojsons.length) {
          zoomToGeoJSON(mergeFeatureCollections(loadedRudaGeojsons), {
            padding: 70,
            duration: 500,
          });
        }

        movePointLayersToTop();
      } finally {
        setIsLoading(false);
      }
    };

    loadRuda();
  }, [isMapReady, layers?.rudaBoundary, selectedRudaPhaseIds]);

  useEffect(() => {
    if (!isMapReady) return;

    const loadGeodeticNetwork = async () => {
      if (!getLayerVisible(layers, "geodeticNetwork", false)) {
        clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
        delete currentGeojson.current["geodetic-network"];
        return;
      }

      try {
        setIsLoading(true);
        const geojson = await getGeodeticNetworkGeoJSON();
        const preparedGeojson = {
          type: "FeatureCollection",
          features: (geojson?.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...(feature?.properties || {}),
              _layerType: "geodeticNetwork",
            },
          })),
        };

        if (preparedGeojson.features.length) {
          drawPointLayer({
            sourceId: GEODETIC_NETWORK_SOURCE,
            layerId: GEODETIC_NETWORK_LAYER,
            geojson: preparedGeojson,
            color: "#dc2626",
            strokeColor: "#ffffff",
            radius: 6,
            opacity: getLayerOpacity(layers, "geodeticNetwork", 100) / 100,
          });
          currentGeojson.current["geodetic-network"] = preparedGeojson;
          zoomToGeoJSON(preparedGeojson, { padding: 70, duration: 500 });
          movePointLayersToTop();
        } else {
          clearPointLayer(GEODETIC_NETWORK_SOURCE, GEODETIC_NETWORK_LAYER);
          delete currentGeojson.current["geodetic-network"];
        }
      } catch (e) {
        console.error("Geodetic network load error:", e);
        setError("Failed to load Geodetic Network");
      } finally {
        setIsLoading(false);
      }
    };

    loadGeodeticNetwork();
  }, [isMapReady, layers?.geodeticNetwork]);

  useEffect(() => {
    if (!selectedMauza || !isMapReady || !getLayerVisible(layers, "squareLayer", false)) {
      clearBoundaryLevel(SQUARE_LEVEL);
      delete currentGeojson.current[SQUARE_LEVEL];
      return;
    }

    const loadSquares = async () => {
      try {
        setIsLoading(true);
        const mauzaId = selectedMauza.mauza_id || selectedMauza.id || selectedMauza;
        const geojson = await getSquares(mauzaId);

        if (geojson?.features?.length) {
          drawBoundaryLevel(
            SQUARE_LEVEL,
            geojson,
            getLayerOpacity(layers, "squareLayer", 35),
          );
          currentGeojson.current[SQUARE_LEVEL] = geojson;
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(SQUARE_LEVEL);
          delete currentGeojson.current[SQUARE_LEVEL];
        }
      } catch (e) {
        console.error("Square boundary load error:", e);
        setError("Failed to load Square Boundary");
      } finally {
        setIsLoading(false);
      }
    };

    loadSquares();
  }, [selectedMauza, isMapReady, layers?.squareLayer]);

  useEffect(() => {
    if (!selectedMauza || !isMapReady || !getLayerVisible(layers, "acreLayer", false)) {
      clearBoundaryLevel(ACRE_LEVEL);
      delete currentGeojson.current[ACRE_LEVEL];
      return;
    }

    const loadAcres = async () => {
      try {
        setIsLoading(true);
        const mauzaId = selectedMauza.mauza_id || selectedMauza.id || selectedMauza;
        const geojson = await getAcres(mauzaId);

        if (geojson?.features?.length) {
          drawBoundaryLevel(
            ACRE_LEVEL,
            geojson,
            getLayerOpacity(layers, "acreLayer", 35),
          );
          currentGeojson.current[ACRE_LEVEL] = geojson;
          zoomToGeoJSON(geojson, { padding: 70, duration: 500 });
        } else {
          clearBoundaryLevel(ACRE_LEVEL);
          delete currentGeojson.current[ACRE_LEVEL];
        }
      } catch (e) {
        console.error("Acre boundary load error:", e);
        setError("Failed to load Acre Boundary");
      } finally {
        setIsLoading(false);
      }
    };

    loadAcres();
  }, [selectedMauza, isMapReady, layers?.acreLayer]);

  useEffect(() => {
    if (!isMapReady) return;

    let cancelled = false;

    const loadAreaBasedPoints = async () => {
      try {
        const areaGeojson = await resolveOpenAreaGeoJSON();
        const hasArea = !!areaGeojson?.features?.length;

        if (getLayerVisible(layers, "triJunctionPoints", false) && hasArea) {
          const trijunctionGeojson = await getTrijunctionPoints({ type: "TJ" });
          if (cancelled) return;

          let filteredTriJunctionGeojson = filterPointGeoJSONByArea(
            trijunctionGeojson,
            areaGeojson,
          );

          if (!filteredTriJunctionGeojson.features.length && selectedMauza) {
            filteredTriJunctionGeojson = {
              type: "FeatureCollection",
              features: (trijunctionGeojson?.features || []).filter((feature) =>
                pointBelongsToMauza(feature, selectedMauza),
              ),
            };
          }

          filteredTriJunctionGeojson = {
            type: "FeatureCollection",
            features: filteredTriJunctionGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "triJunctionPoints",
              },
            })),
          };

          if (filteredTriJunctionGeojson.features.length) {
            drawTriJunctionLayer({
              sourceId: TRI_JUNCTION_POINTS_SOURCE,
              layerId: TRI_JUNCTION_POINTS_LAYER,
              geojson: filteredTriJunctionGeojson,
            });
            currentGeojson.current["tri-junction-points"] = filteredTriJunctionGeojson;
            movePointLayersToTop();
          } else {
            clearPointLayer(TRI_JUNCTION_POINTS_SOURCE, TRI_JUNCTION_POINTS_LAYER);
            delete currentGeojson.current["tri-junction-points"];
          }
        } else {
          clearPointLayer(TRI_JUNCTION_POINTS_SOURCE, TRI_JUNCTION_POINTS_LAYER);
          delete currentGeojson.current["tri-junction-points"];
        }

        if (getLayerVisible(layers, "fieldPoints", false) && hasArea) {
          const fieldPointsGeojson = await getFieldPoints();
          if (cancelled) return;

          const filteredFieldPointsGeojson = filterPointGeoJSONByArea(
            fieldPointsGeojson,
            areaGeojson,
          );

          const preparedFieldPointsGeojson = {
            type: "FeatureCollection",
            features: filteredFieldPointsGeojson.features.map((feature) => ({
              ...feature,
              properties: {
                ...(feature?.properties || {}),
                _layerType: "fieldPoints",
              },
            })),
          };

          if (preparedFieldPointsGeojson.features.length) {
            drawPointLayer({
              sourceId: FIELD_POINTS_SOURCE,
              layerId: FIELD_POINTS_LAYER,
              geojson: preparedFieldPointsGeojson,
              color: "#2563eb",
              strokeColor: "#ffffff",
              radius: 4.5,
              opacity: getLayerOpacity(layers, "fieldPoints", 100) / 100,
            });
            currentGeojson.current["field-points"] = preparedFieldPointsGeojson;
            movePointLayersToTop();
          } else {
            clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
            delete currentGeojson.current["field-points"];
          }
        } else {
          clearPointLayer(FIELD_POINTS_SOURCE, FIELD_POINTS_LAYER);
          delete currentGeojson.current["field-points"];
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Area based points load error:", e);
          setError("Failed to load area based points");
        }
      }
    };

    loadAreaBasedPoints();

    return () => {
      cancelled = true;
    };
  }, [
    isMapReady,
    selectedMauza,
    selectedFeatureNumber,
    layers?.triJunctionPoints,
    layers?.fieldPoints,
  ]);

  useEffect(() => {
    const shouldShowKhasra =
      !!selectedMauza &&
      isMapReady &&
      getLayerVisible(layers, "khasraLayer", false) &&
      (viewBy === "khasra" || getLayerForceLoad(layers, "khasraLayer"));

    if (!shouldShowKhasra) {
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
    const shouldShowMurabba =
      !!selectedMauza &&
      isMapReady &&
      getLayerVisible(layers, "murabbaLayer", false) &&
      (viewBy === "murabba" || getLayerForceLoad(layers, "murabbaLayer"));

    if (!shouldShowMurabba) {
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

        if (
          getLayerVisible(layers, "controlPoints", false) &&
          normalizedMauza
        ) {
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

        if (
          getLayerVisible(layers, "triJunctionPoints", false) &&
          normalizedMauza
        ) {
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

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const dsmVisible = typeof layers?.dsm === 'object' ? layers.dsm.visible : !!layers?.dsm;
    const dtmVisible = typeof layers?.dtm === 'object' ? layers.dtm.visible : !!layers?.dtm;
    const orthoVisible = typeof layers?.ortho === 'object' ? layers.ortho.visible : !!layers?.ortho;
    const asBuiltJan2023Visible = typeof layers?.asBuiltJan2023 === 'object' ? layers.asBuiltJan2023.visible : !!layers?.asBuiltJan2023;
    const orthoJune2023Visible = typeof layers?.orthoJune2023 === 'object' ? layers.orthoJune2023.visible : !!layers?.orthoJune2023;
    const orthoNov2024Visible = typeof layers?.orthoNov2024 === 'object' ? layers.orthoNov2024.visible : !!layers?.orthoNov2024;
    const handuGujranOrthoVisible = typeof layers?.handuGujranOrtho === 'object' ? layers.handuGujranOrtho.visible : !!layers?.handuGujranOrtho;

    const shouldFlyTo = (orthoVisible && !prevOrthoVisible.current) || (dsmVisible && !prevDsmVisible.current) || (dtmVisible && !prevDtmVisible.current) || (asBuiltJan2023Visible && !prevAsBuiltJan2023Visible.current) || (orthoJune2023Visible && !prevOrthoJune2023Visible.current) || (orthoNov2024Visible && !prevOrthoNov2024Visible.current) || (handuGujranOrthoVisible && !prevHanduGujranOrthoVisible.current);

    if (shouldFlyTo) {
      const bounds = [
        [74.42562653088396, 31.60509230706726],
        [74.43545280361002, 31.61121654113590]
      ];
      map.fitBounds(bounds, { padding: 50, duration: 1500 });
    }

    prevDsmVisible.current = dsmVisible;
    prevDtmVisible.current = dtmVisible;
    prevOrthoVisible.current = orthoVisible;
    prevAsBuiltJan2023Visible.current = asBuiltJan2023Visible;
    prevOrthoJune2023Visible.current = orthoJune2023Visible;
    prevOrthoNov2024Visible.current = orthoNov2024Visible;
    prevHanduGujranOrthoVisible.current = handuGujranOrthoVisible;

    const restoreRasters = () => {
      // Ortho Layer
      const orthoOpacity = typeof layers?.ortho === 'object' && Number.isFinite(layers.ortho.opacity) ? layers.ortho.opacity / 100 : 1.0;

      if (orthoVisible) {
        if (!map.getSource(ORTHO_SOURCE)) {
          map.addSource(ORTHO_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_Ortho/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(ORTHO_LAYER)) {
          map.addLayer({
              id: ORTHO_LAYER,
              type: 'raster',
              source: ORTHO_SOURCE,
              paint: { 'raster-opacity': orthoOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(ORTHO_LAYER, 'visibility', 'visible');
          map.setPaintProperty(ORTHO_LAYER, 'raster-opacity', orthoOpacity);
        }
      } else {
        if (map.getLayer(ORTHO_LAYER)) {
          map.setLayoutProperty(ORTHO_LAYER, 'visibility', 'none');
        }
      }

      // DSM Layer
      const dsmOpacity = typeof layers?.dsm === 'object' && Number.isFinite(layers.dsm.opacity) ? layers.dsm.opacity / 100 : 0.85;

      if (dsmVisible) {
        if (!map.getSource(DSM_SOURCE)) {
          map.addSource(DSM_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_DSM/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(DSM_LAYER)) {
          map.addLayer({
              id: DSM_LAYER,
              type: 'raster',
              source: DSM_SOURCE,
              paint: { 'raster-opacity': dsmOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(DSM_LAYER, 'visibility', 'visible');
          map.setPaintProperty(DSM_LAYER, 'raster-opacity', dsmOpacity);
        }
      } else {
        if (map.getLayer(DSM_LAYER)) {
          map.setLayoutProperty(DSM_LAYER, 'visibility', 'none');
        }
      }

      // DTM Layer
      const dtmVisible = typeof layers?.dtm === 'object' ? layers.dtm.visible : !!layers?.dtm;
      const dtmOpacity = typeof layers?.dtm === 'object' && Number.isFinite(layers.dtm.opacity) ? layers.dtm.opacity / 100 : 0.85;

      if (dtmVisible) {
        if (!map.getSource(DTM_SOURCE)) {
          map.addSource(DTM_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chaharbagh_DTM/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(DTM_LAYER)) {
          map.addLayer({
              id: DTM_LAYER,
              type: 'raster',
              source: DTM_SOURCE,
              paint: { 'raster-opacity': dtmOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(DTM_LAYER, 'visibility', 'visible');
          map.setPaintProperty(DTM_LAYER, 'raster-opacity', dtmOpacity);
        }
      } else {
        if (map.getLayer(DTM_LAYER)) {
          map.setLayoutProperty(DTM_LAYER, 'visibility', 'none');
        }
      }

      // AsBuilt Jan 2023 Layer
      const asBuiltJan2023Opacity = typeof layers?.asBuiltJan2023 === 'object' && Number.isFinite(layers.asBuiltJan2023.opacity) ? layers.asBuiltJan2023.opacity / 100 : 1.0;

      if (asBuiltJan2023Visible) {
        if (!map.getSource(AS_BUILT_JAN_2023_SOURCE)) {
          map.addSource(AS_BUILT_JAN_2023_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chahar_Bagh_AsBuilt_Jan2023/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(AS_BUILT_JAN_2023_LAYER)) {
          map.addLayer({
              id: AS_BUILT_JAN_2023_LAYER,
              type: 'raster',
              source: AS_BUILT_JAN_2023_SOURCE,
              paint: { 'raster-opacity': asBuiltJan2023Opacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(AS_BUILT_JAN_2023_LAYER, 'visibility', 'visible');
          map.setPaintProperty(AS_BUILT_JAN_2023_LAYER, 'raster-opacity', asBuiltJan2023Opacity);
        }
      } else {
        if (map.getLayer(AS_BUILT_JAN_2023_LAYER)) {
          map.setLayoutProperty(AS_BUILT_JAN_2023_LAYER, 'visibility', 'none');
        }
      }

      // Ortho June 2023 Layer
      const orthoJune2023Opacity = typeof layers?.orthoJune2023 === 'object' && Number.isFinite(layers.orthoJune2023.opacity) ? layers.orthoJune2023.opacity / 100 : 1.0;

      if (orthoJune2023Visible) {
        if (!map.getSource(ORTHO_JUNE_2023_SOURCE)) {
          map.addSource(ORTHO_JUNE_2023_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chahar_Bagh_Ortho_June2023/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(ORTHO_JUNE_2023_LAYER)) {
          map.addLayer({
              id: ORTHO_JUNE_2023_LAYER,
              type: 'raster',
              source: ORTHO_JUNE_2023_SOURCE,
              paint: { 'raster-opacity': orthoJune2023Opacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(ORTHO_JUNE_2023_LAYER, 'visibility', 'visible');
          map.setPaintProperty(ORTHO_JUNE_2023_LAYER, 'raster-opacity', orthoJune2023Opacity);
        }
      } else {
        if (map.getLayer(ORTHO_JUNE_2023_LAYER)) {
          map.setLayoutProperty(ORTHO_JUNE_2023_LAYER, 'visibility', 'none');
        }
      }

      // Ortho Nov 2024 Layer
      const orthoNov2024Opacity = typeof layers?.orthoNov2024 === 'object' && Number.isFinite(layers.orthoNov2024.opacity) ? layers.orthoNov2024.opacity / 100 : 1.0;

      if (orthoNov2024Visible) {
        if (!map.getSource(ORTHO_NOV_2024_SOURCE)) {
          map.addSource(ORTHO_NOV_2024_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Chahar_Bagh_Ortho_Nov2024/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(ORTHO_NOV_2024_LAYER)) {
          map.addLayer({
              id: ORTHO_NOV_2024_LAYER,
              type: 'raster',
              source: ORTHO_NOV_2024_SOURCE,
              paint: { 'raster-opacity': orthoNov2024Opacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(ORTHO_NOV_2024_LAYER, 'visibility', 'visible');
          map.setPaintProperty(ORTHO_NOV_2024_LAYER, 'raster-opacity', orthoNov2024Opacity);
        }
      } else {
        if (map.getLayer(ORTHO_NOV_2024_LAYER)) {
          map.setLayoutProperty(ORTHO_NOV_2024_LAYER, 'visibility', 'none');
        }
      }

      // Handu Gujran Ortho Layer
      const handuGujranOrthoOpacity = typeof layers?.handuGujranOrtho === 'object' && Number.isFinite(layers.handuGujranOrtho.opacity) ? layers.handuGujranOrtho.opacity / 100 : 1.0;

      if (handuGujranOrthoVisible) {
        if (!map.getSource(HANDU_GUJRAN_ORTHO_SOURCE)) {
          map.addSource(HANDU_GUJRAN_ORTHO_SOURCE, {
              type: 'raster',
              tiles: ['http://localhost:8080/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png'],
              tileSize: 256
          });
        }
        if (!map.getLayer(HANDU_GUJRAN_ORTHO_LAYER)) {
          map.addLayer({
              id: HANDU_GUJRAN_ORTHO_LAYER,
              type: 'raster',
              source: HANDU_GUJRAN_ORTHO_SOURCE,
              paint: { 'raster-opacity': handuGujranOrthoOpacity },
              layout: { 'visibility': 'visible' }
          });
        } else {
          map.setLayoutProperty(HANDU_GUJRAN_ORTHO_LAYER, 'visibility', 'visible');
          map.setPaintProperty(HANDU_GUJRAN_ORTHO_LAYER, 'raster-opacity', handuGujranOrthoOpacity);
        }
      } else {
        if (map.getLayer(HANDU_GUJRAN_ORTHO_LAYER)) {
          map.setLayoutProperty(HANDU_GUJRAN_ORTHO_LAYER, 'visibility', 'none');
        }
      }
    };

    restoreRasters();
    
    // Attempt to restore if style changes
    map.on('style.load', restoreRasters);
    return () => {
      map.off('style.load', restoreRasters);
    };
  }, [layers?.dsm, layers?.dtm, layers?.ortho, layers?.asBuiltJan2023, layers?.orthoJune2023, layers?.orthoNov2024, layers?.handuGujranOrtho, isMapReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const measureVisible = typeof layers?.measure === 'object' ? layers.measure.visible : !!layers?.measure;

    const updateMeasureSource = () => {
      const coords = measureCoordsRef.current;
      const features = [];
      
      if (coords.length > 0) {
        coords.forEach(coord => {
          features.push(turf.point(coord));
        });
      }
      
      if (coords.length > 1) {
        const line = turf.lineString(coords);
        features.push(line);
        
        const distance = turf.length(line, { units: 'kilometers' });
        // Add a label point at the end
        const lastPoint = turf.point(coords[coords.length - 1], {
          distance: `${distance.toFixed(2)} km`
        });
        features.push(lastPoint);
      }
      
      if (map.getSource(MEASURE_SOURCE)) {
        map.getSource(MEASURE_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleMapClick = (e) => {
      measureCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateMeasureSource();
    };

    const handleMapRightClick = (e) => {
      e.preventDefault();
      // clear measure on right click
      measureCoordsRef.current = [];
      updateMeasureSource();
    };

    if (measureVisible) {
      map.getCanvas().style.cursor = 'crosshair';
      
      if (!map.getSource(MEASURE_SOURCE)) {
        map.addSource(MEASURE_SOURCE, {
          type: 'geojson',
          data: emptyFeatureCollection()
        });
      }
      
      if (!map.getLayer(MEASURE_LINE_LAYER)) {
        map.addLayer({
          id: MEASURE_LINE_LAYER,
          type: 'line',
          source: MEASURE_SOURCE,
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#ff0000',
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        });
      }
      
      if (!map.getLayer(MEASURE_POINTS_LAYER)) {
        map.addLayer({
          id: MEASURE_POINTS_LAYER,
          type: 'circle',
          source: MEASURE_SOURCE,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ff0000'
          }
        });
      }
      
      if (!map.getLayer(MEASURE_LABELS_LAYER)) {
        map.addLayer({
          id: MEASURE_LABELS_LAYER,
          type: 'symbol',
          source: MEASURE_SOURCE,
          filter: ['has', 'distance'],
          layout: {
            'text-field': ['get', 'distance'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'bottom',
            'text-offset': [0, -1]
          },
          paint: {
            'text-color': '#ff0000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        });
      }

      map.on('click', handleMapClick);
      map.on('contextmenu', handleMapRightClick);
      
      updateMeasureSource();

    } else {
      map.getCanvas().style.cursor = '';
      measureCoordsRef.current = [];
      
      if (map.getSource(MEASURE_SOURCE)) {
        map.getSource(MEASURE_SOURCE).setData(emptyFeatureCollection());
      }
      
      map.off('click', handleMapClick);
      map.off('contextmenu', handleMapRightClick);
    }

    return () => {
      map.off('click', handleMapClick);
      map.off('contextmenu', handleMapRightClick);
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = '';
      }
    };
  }, [layers?.measure, isMapReady]);

  // ── Area Measure Tool ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const areaVisible = typeof layers?.measureArea === "object"
      ? layers.measureArea.visible
      : !!layers?.measureArea;

    const clearAreaLayers = () => {
      try {
        if (map.getLayer(MEASURE_AREA_LABEL_LAYER)) map.removeLayer(MEASURE_AREA_LABEL_LAYER);
        if (map.getLayer(MEASURE_AREA_FILL_LAYER)) map.removeLayer(MEASURE_AREA_FILL_LAYER);
        if (map.getLayer(MEASURE_AREA_LINE_LAYER)) map.removeLayer(MEASURE_AREA_LINE_LAYER);
        if (map.getLayer(MEASURE_AREA_POINTS_LAYER)) map.removeLayer(MEASURE_AREA_POINTS_LAYER);
        if (map.getSource(MEASURE_AREA_SOURCE)) map.removeSource(MEASURE_AREA_SOURCE);
      } catch (e) { /* ignore */ }
    };

    const updateAreaSource = (closed = false) => {
      const coords = measureAreaCoordsRef.current;
      const features = [];

      coords.forEach((c) => features.push(turf.point(c)));

      if (coords.length >= 2) {
        const lineCoords = closed ? [...coords, coords[0]] : coords;
        features.push(turf.lineString(lineCoords));
      }

      if (closed && coords.length >= 3) {
        const poly = turf.polygon([[...coords, coords[0]]]);
        features.push(poly);
        const areaSqM = turf.area(poly);
        const areaAcres = areaSqM / 4046.8564224;
        const areaKanal = areaAcres * 8;
        const centroid = turf.centroid(poly);
        centroid.properties = {
          areaLabel: `${areaSqM.toFixed(0)} m²  |  ${areaAcres.toFixed(3)} ac  |  ${areaKanal.toFixed(2)} kanal`,
        };
        features.push(centroid);
      }

      if (map.getSource(MEASURE_AREA_SOURCE)) {
        map.getSource(MEASURE_AREA_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleClick = (e) => {
      measureAreaCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      updateAreaSource(false);
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      if (measureAreaCoordsRef.current.length >= 3) {
        updateAreaSource(true);
      } else {
        measureAreaCoordsRef.current = [];
        updateAreaSource(false);
      }
    };

    if (areaVisible) {
      map.getCanvas().style.cursor = "crosshair";

      if (!map.getSource(MEASURE_AREA_SOURCE)) {
        map.addSource(MEASURE_AREA_SOURCE, {
          type: "geojson",
          data: turf.featureCollection([]),
        });
      }

      if (!map.getLayer(MEASURE_AREA_FILL_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_FILL_LAYER,
          type: "fill",
          source: MEASURE_AREA_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#0066ff", "fill-opacity": 0.15 },
        });
      }

      if (!map.getLayer(MEASURE_AREA_LINE_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_LINE_LAYER,
          type: "line",
          source: MEASURE_AREA_SOURCE,
          filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
          paint: { "line-color": "#0066ff", "line-width": 2, "line-dasharray": [2, 2] },
        });
      }

      if (!map.getLayer(MEASURE_AREA_POINTS_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_POINTS_LAYER,
          type: "circle",
          source: MEASURE_AREA_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0066ff",
          },
        });
      }

      if (!map.getLayer(MEASURE_AREA_LABEL_LAYER)) {
        map.addLayer({
          id: MEASURE_AREA_LABEL_LAYER,
          type: "symbol",
          source: MEASURE_AREA_SOURCE,
          filter: ["has", "areaLabel"],
          layout: {
            "text-field": ["get", "areaLabel"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 12,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#003399",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      measureAreaCoordsRef.current = [];
      clearAreaLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureArea, isMapReady]);

  // ── Bearing Tool ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const bearingVisible = typeof layers?.measureBearing === "object"
      ? layers.measureBearing.visible
      : !!layers?.measureBearing;

    const clearBearingLayers = () => {
      try {
        if (map.getLayer(BEARING_LABEL_LAYER)) map.removeLayer(BEARING_LABEL_LAYER);
        if (map.getLayer(BEARING_LINE_LAYER)) map.removeLayer(BEARING_LINE_LAYER);
        if (map.getLayer(BEARING_POINTS_LAYER)) map.removeLayer(BEARING_POINTS_LAYER);
        if (map.getSource(BEARING_SOURCE)) map.removeSource(BEARING_SOURCE);
      } catch (e) { /* ignore */ }
    };

    const updateBearingSource = () => {
      const coords = bearingCoordsRef.current;
      const features = [];

      coords.forEach((c) => features.push(turf.point(c)));

      if (coords.length === 2) {
        features.push(turf.lineString(coords));
        const bearing = turf.bearing(turf.point(coords[0]), turf.point(coords[1]));
        const dist = turf.distance(turf.point(coords[0]), turf.point(coords[1]), { units: "meters" });
        const midpoint = turf.midpoint(turf.point(coords[0]), turf.point(coords[1]));
        midpoint.properties = {
          bearingLabel: `${bearing.toFixed(1)}°  ·  ${dist.toFixed(1)} m`,
        };
        features.push(midpoint);
      }

      if (map.getSource(BEARING_SOURCE)) {
        map.getSource(BEARING_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleClick = (e) => {
      if (bearingCoordsRef.current.length >= 2) {
        bearingCoordsRef.current = [[e.lngLat.lng, e.lngLat.lat]];
      } else {
        bearingCoordsRef.current.push([e.lngLat.lng, e.lngLat.lat]);
      }
      updateBearingSource();
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      bearingCoordsRef.current = [];
      updateBearingSource();
    };

    if (bearingVisible) {
      map.getCanvas().style.cursor = "crosshair";

      if (!map.getSource(BEARING_SOURCE)) {
        map.addSource(BEARING_SOURCE, {
          type: "geojson",
          data: turf.featureCollection([]),
        });
      }

      if (!map.getLayer(BEARING_LINE_LAYER)) {
        map.addLayer({
          id: BEARING_LINE_LAYER,
          type: "line",
          source: BEARING_SOURCE,
          filter: ["==", "$type", "LineString"],
          paint: { "line-color": "#e67e00", "line-width": 2 },
        });
      }

      if (!map.getLayer(BEARING_POINTS_LAYER)) {
        map.addLayer({
          id: BEARING_POINTS_LAYER,
          type: "circle",
          source: BEARING_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#e67e00",
          },
        });
      }

      if (!map.getLayer(BEARING_LABEL_LAYER)) {
        map.addLayer({
          id: BEARING_LABEL_LAYER,
          type: "symbol",
          source: BEARING_SOURCE,
          filter: ["has", "bearingLabel"],
          layout: {
            "text-field": ["get", "bearingLabel"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 13,
            "text-anchor": "bottom",
            "text-offset": [0, -1],
          },
          paint: {
            "text-color": "#b35000",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      bearingCoordsRef.current = [];
      clearBearingLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureBearing, isMapReady]);

  // ── Coordinate Picker ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const coordVisible = typeof layers?.coordPicker === "object"
      ? layers.coordPicker.visible
      : !!layers?.coordPicker;

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      const lngStr = lng.toFixed(6);
      const latStr = lat.toFixed(6);

      if (coordPickerPopupRef.current) {
        coordPickerPopupRef.current.remove();
        coordPickerPopupRef.current = null;
      }

      navigator.clipboard?.writeText(`${latStr}, ${lngStr}`).catch(() => {});

      const popup = new mapboxgl.Popup({
        offset: 10,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
      })
        .setLngLat([lng, lat])
        .setHTML(`
          <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#1f2937;min-width:190px">
            <div style="font-weight:700;color:#0f3d2e;margin-bottom:6px;font-size:13px;">📍 Coordinates</div>
            <div><span style="font-weight:600">Latitude:</span> ${latStr}</div>
            <div><span style="font-weight:600">Longitude:</span> ${lngStr}</div>
            <div style="margin-top:8px;padding:4px 8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:11px;color:#166534">
              ✓ Copied to clipboard
            </div>
          </div>
        `)
        .addTo(map);

      coordPickerPopupRef.current = popup;
      popup.on("close", () => { coordPickerPopupRef.current = null; });
    };

    if (coordVisible) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleClick);
    } else {
      map.getCanvas().style.cursor = "";
      if (coordPickerPopupRef.current) {
        coordPickerPopupRef.current.remove();
        coordPickerPopupRef.current = null;
      }
      map.off("click", handleClick);
    }

    return () => {
      map.off("click", handleClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.coordPicker, isMapReady]);

  // ── Buffer Tool ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const bufferVisible = typeof layers?.measureBuffer === "object"
      ? layers.measureBuffer.visible
      : !!layers?.measureBuffer;

    const clearBufferLayers = () => {
      try {
        if (map.getLayer(BUFFER_CENTER_LAYER)) map.removeLayer(BUFFER_CENTER_LAYER);
        if (map.getLayer(BUFFER_FILL_LAYER)) map.removeLayer(BUFFER_FILL_LAYER);
        if (map.getLayer(BUFFER_LINE_LAYER)) map.removeLayer(BUFFER_LINE_LAYER);
        if (map.getSource(BUFFER_SOURCE)) map.removeSource(BUFFER_SOURCE);
      } catch (e) { /* ignore */ }
    };

    const BUFFER_RADIUS_M = 500;

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      const pt = turf.point([lng, lat]);
      const buffered = turf.buffer(pt, BUFFER_RADIUS_M, { units: "meters" });
      const features = [pt, buffered];

      if (!map.getSource(BUFFER_SOURCE)) {
        map.addSource(BUFFER_SOURCE, {
          type: "geojson",
          data: turf.featureCollection(features),
        });

        map.addLayer({
          id: BUFFER_FILL_LAYER,
          type: "fill",
          source: BUFFER_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#9333ea", "fill-opacity": 0.12 },
        });

        map.addLayer({
          id: BUFFER_LINE_LAYER,
          type: "line",
          source: BUFFER_SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: { "line-color": "#9333ea", "line-width": 2 },
        });

        map.addLayer({
          id: BUFFER_CENTER_LAYER,
          type: "circle",
          source: BUFFER_SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#9333ea",
          },
        });
      } else {
        map.getSource(BUFFER_SOURCE).setData(turf.featureCollection(features));
      }
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      clearBufferLayers();
    };

    if (bufferVisible) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", handleClick);
      map.on("contextmenu", handleRightClick);
    } else {
      map.getCanvas().style.cursor = "";
      clearBufferLayers();
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    }

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
      if (map.getCanvas()) map.getCanvas().style.cursor = "";
    };
  }, [layers?.measureBuffer, isMapReady]);

  // ── Print / Export Map ────────────────────────────────────────────────────
  // Exposed via ref so parent can trigger it without toggling layer state
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapReady) return;

    const printVisible = typeof layers?.printMap === "object"
      ? layers.printMap.visible
      : !!layers?.printMap;

    if (!printVisible) return;

    try {
      const canvas = map.getCanvas();
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `map-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn("Map export failed — ensure preserveDrawingBuffer is true", e);
    }

    // Notify parent to reset the flag so it doesn't re-trigger
    if (typeof onMapReady === "function") {
      // We reuse onMapReady only for the map instance; export reset is handled by MapPage
    }
  }, [layers?.printMap, isMapReady]);

  return (
    <div
      ref={mapWrapperRef}
      className="absolute inset-0 w-full h-full bg-white"
    >
      <div
        ref={mapRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      />

      {/* <MapControls
        map={isMapReady ? mapInstance.current : null}
        fullscreenTargetRef={mapWrapperRef}
      /> */}

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
