import { setBasemapMauzaPlaceFilter } from "./LayerManager/_basemapPlaceLabelFilter";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import { AlignJustify, CaseSensitive, ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import { createPortal } from "react-dom";
import MauzaBoundaryAttribute from "./AttributeTable/Cadastral/MauzaBoundaryAttribute";
import KhasraBoundaryAttribute from "./AttributeTable/Cadastral/KhasraBoundaryAttribute";
import SquareBoundaryAttribute from "./AttributeTable/Cadastral/SquareBoundaryAttribute";
import AwardedLandAttribute from "./AttributeTable/Cadastral/AwardedLandAttribute";
import StateLandAttribute from "./AttributeTable/Cadastral/StateLandAttribute";
import PossessionLandAttribute from "./AttributeTable/Cadastral/PossessionLandAttribute";
import { addAwardedLandLayer } from "./LayerManager/Cadastral/AwardedLandLayer";
import { addStateLandLayer } from "./LayerManager/Cadastral/StateLandLayer";
import {
  addPossessionLandLayer,
  POSSESSION_LAND_TYPES,
} from "./LayerManager/Cadastral/PossessionLandLayer";
import {
  addMauzaBoundaryLayer,
  MAUZA_BOUNDARY_IDS,
} from "./LayerManager/Cadastral/MauzaBoundaryLayer";
import {
  addSquareBoundaryLayer,
  SQUARE_BOUNDARY_IDS,
} from "./LayerManager/Cadastral/SquareBoundaryLayer";
import {
  addKhasraBoundaryLayer,
  KHASRA_BOUNDARY_IDS,
} from "./LayerManager/Cadastral/KhasraBoundaryLayer";
import {
  API_BASE,
  formatNumber,
  unwrapGeoJSON,
} from "./AttributeTable/AdminAttributeTableShell";
import { readAreaSqft } from "./AttributeTable/areaUtils";
import InlineLayerLegend from "./_InlineLayerLegend";
import { lineLegend, polygonLegend, pointLegend } from "./_legendUtils";

const MASAWI_SOURCE = "gis-handu-gujran-ortho-source";
const MASAWI_LAYER = "gis-handu-gujran-ortho-layer";
const MASAWI_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

const MASAWI_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

// RUDA Khasra contains roughly 233,000 polygons. Loading that table as one
// GeoJSON response blocks the browser while JSON is parsed and rendered.
// The Khasra layer therefore uses PostGIS vector tiles and only downloads the
// tiles visible in the current map viewport.
const KHASRA_SOURCE_LAYER = "ruda_khasra";
const KHASRA_MIN_ZOOM = 10;
const KHASRA_VISIBLE_LIST_LIMIT = 250;

const IDS = {
  moza: MAUZA_BOUNDARY_IDS,
  square: SQUARE_BOUNDARY_IDS,
  khasra: KHASRA_BOUNDARY_IDS,
};

const KHASRA_VECTOR_SOURCE_ID =
  KHASRA_BOUNDARY_IDS.source ||
  KHASRA_BOUNDARY_IDS.src ||
  "metaverse-khasra-boundary-source";

const BOUNDARY_LAYER_CONFIG = {
  moza: { addLayer: addMauzaBoundaryLayer },
  square: { addLayer: addSquareBoundaryLayer },
  khasra: { addLayer: addKhasraBoundaryLayer },
};

// NULL means keep the existing zoom-responsive styling until Apply is clicked.
const DEFAULT_MAUZA_CONTROL_VALUES = Object.freeze({ lineWidth: 1.5, labelSize: 12 });
const MAUZA_SIZE_LIMITS = Object.freeze({
  line: { min: 0.5, max: 20, step: 0.5, title: "Mauza boundary line width", unit: "px" },
  label: { min: 6, max: 48, step: 1, title: "Mauza label size", unit: "px" },
});

const MAUZA_DEF = {
  key: "moza",
  label: "Mauza Boundary",
  color: "#2C2C2A",
  type: "polygon",
};

const LAYER_DEFS = [
  {
    key: "square",
    label: "Square Boundary",
    color: "#185FA5",
    type: "polygon",
  },
  {
    key: "khasra",
    label: "Khasra Boundary",
    color: "#712B13",
    type: "polygon",
    dropdown: true,
  },
];

const ALL_LAYER_DEFS = [MAUZA_DEF, ...LAYER_DEFS];

const EXTRA_LAYER_DEFS = [
  {
    key: "possessionLand",
    label: "Possession Land",
    color: POSSESSION_LAND_TYPES[0].lineColor,
  },
  { key: "awardedLand", label: "Awarded Land", color: "#854F0B" },
  { key: "stateLand", label: "State Land", color: "#5F5E5A" },
];

const EXTRA_LAYER_CONFIG = {
  awardedLand: {
    endpoint: "/awardedland/",
    sourceId: "metaverse-awarded-land-source",
    layerIds: [
      "metaverse-awarded-land-fill",
      "metaverse-awarded-land-line",
      "metaverse-awarded-land-label",
    ],
    addLayer: addAwardedLandLayer,
  },
  stateLand: {
    endpoint: "/stateland/",
    sourceId: "metaverse-state-land-source",
    layerIds: [
      "metaverse-state-land-fill",
      "metaverse-state-land-line",
      "metaverse-state-land-label",
    ],
    addLayer: addStateLandLayer,
  },
  possessionLand: {
    endpoint: "/possessionland/",
    sourceId: "metaverse-possession-land-source",
    layerIds: [
      "metaverse-possession-land-fill",
      "metaverse-possession-land-line",
      "metaverse-possession-land-label",
    ],
    addLayer: addPossessionLandLayer,
  },
};

const ALL_CADASTRAL_LAYER_DEFS = [...ALL_LAYER_DEFS, ...EXTRA_LAYER_DEFS];

const DEFAULT_POSSESSION_TYPE_VISIBILITY = Object.fromEntries(
  POSSESSION_LAND_TYPES.map((type) => [type.key, true]),
);

function normalizePossessionLandType(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function filterPossessionLandGeoJSON(geojson, typeVisibility) {
  const allowedTypes = new Set(
    POSSESSION_LAND_TYPES.filter((type) => typeVisibility[type.key]).map(
      (type) => normalizePossessionLandType(type.value),
    ),
  );

  return {
    type: "FeatureCollection",
    features: (geojson?.features || []).filter((feature) =>
      allowedTypes.has(
        normalizePossessionLandType(feature?.properties?.l_type),
      ),
    ),
  };
}

function countPossessionLandTypeFeatures(geojson, typeValue) {
  const normalizedType = normalizePossessionLandType(typeValue);

  return (geojson?.features || []).filter(
    (feature) =>
      normalizePossessionLandType(feature?.properties?.l_type) ===
      normalizedType,
  ).length;
}

function setExtraVisibility(map, key, visible) {
  const config = EXTRA_LAYER_CONFIG[key];
  if (!map || !config) return;

  config.layerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }
  });
}

function fitToExtraGeoJSON(map, geojson) {
  if (!map || !geojson?.features?.length) return;

  import("mapbox-gl").then((module) => {
    const bounds = new module.default.LngLatBounds();

    const walk = (coordinates) => {
      if (!Array.isArray(coordinates)) return;
      if (
        typeof coordinates[0] === "number" &&
        typeof coordinates[1] === "number"
      ) {
        bounds.extend(coordinates);
        return;
      }
      coordinates.forEach(walk);
    };

    geojson.features.forEach((feature) => walk(feature?.geometry?.coordinates));

    // if (!bounds.isEmpty()) {
    //   map.fitBounds(bounds, {
    //     padding: 50,
    //     duration: 900,
    //     maxZoom: 15,
    //   });
    // }
  });
}

function emptyFC() {
  return { type: "FeatureCollection", features: [] };
}

function unwrapBoundaryGeoJSON(responseData) {
  const geojson = unwrapGeoJSON(responseData);
  const payload =
    responseData?.data?.data ?? responseData?.data ?? responseData;

  if (Array.isArray(payload?.bbox)) {
    geojson.bbox = payload.bbox;
  }

  return geojson;
}

const LAND_REVENUE_LAYER_ORDER = [
  IDS.moza.fill,
  IDS.moza.line,
  IDS.moza.label,
  IDS.square.fill,
  IDS.square.line,
  IDS.square.label,
  IDS.khasra.fill,
  IDS.khasra.line,
  IDS.khasra.label,
];

const MASTER_PLAN_LAYER_CANDIDATES = [
  "gism-master-plan-fill",
  "gism-master-plan-line",
  "gism-master-plan-label",
  "master-plan-fill",
  "master-plan-line",
  "master-plan-label",
  "masterPlanFill",
  "masterPlanLine",
  "masterPlanLabel",
];

function getFirstExistingLayer(map, layerIds = []) {
  return layerIds.find((layerId) => layerId && map.getLayer(layerId));
}

function getLandRevenueBeforeId(map) {
  const exactMatch = getFirstExistingLayer(map, MASTER_PLAN_LAYER_CANDIDATES);
  if (exactMatch) return exactMatch;

  const styleLayers = map.getStyle?.().layers || [];

  return styleLayers.find((layer) => {
    const id = String(layer?.id || "").toLowerCase();
    return (
      id.includes("master") &&
      (id.includes("plan") || id.includes("plot")) &&
      !id.includes("lrr") &&
      !id.includes("land-revenue")
    );
  })?.id;
}

function moveLayerSafely(map, layerId, beforeId) {
  if (!map || !layerId || !map.getLayer(layerId)) return;

  try {
    if (beforeId && beforeId !== layerId && map.getLayer(beforeId)) {
      map.moveLayer(layerId, beforeId);
      return;
    }

    map.moveLayer(layerId);
  } catch (_) {}
}

function reorderLandRevenueLayers(map) {
  if (!map?.getStyle) return;
  const beforeMasterPlanLayerId = getLandRevenueBeforeId(map);
  const active = LAND_REVENUE_LAYER_ORDER.filter((layerId) => map.getLayer(layerId));
  if (!active.length) return;
  const current = (map.getStyle()?.layers || []).map((layer) => layer.id);
  const target = beforeMasterPlanLayerId ? current.indexOf(beforeMasterPlanLayerId) : current.length;
  if (target < 0) return;
  // Avoid a styledata -> moveLayer -> styledata feedback loop.
  if (active.every((id, i) => current[target - active.length + i] === id)) return;
  active.forEach((layerId) => moveLayerSafely(map, layerId, beforeMasterPlanLayerId));
}

function getLabelExpression(key) {
  if (key === "moza") {
    return [
      "coalesce",
      ["to-string", ["get", "mauza"]],
      ["to-string", ["get", "Mauza"]],
      ["to-string", ["get", "moza"]],
      ["to-string", ["get", "Moza"]],
      ["to-string", ["get", "name"]],
      ["to-string", ["get", "Name"]],
      "",
    ];
  }

  if (key === "khasra") {
    // PostgreSQL's ruda_khasra vector tiles expose these attributes.
    // Convert after coalescing so a missing key cannot suppress the fallback.
    return ["to-string", ["coalesce", ["get", "join_shp"], ["get", "kh"], ["get", "khasra_id"], ""]];
  }

  return "";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMauzaId(feature) {
  return toNumber(
    feature?.properties?.mauza_id ??
      feature?.properties?.gid ??
      feature?.properties?.id ??
      feature?.properties?.moza_id,
  );
}

function getMauzaName(feature) {
  return (
    feature?.properties?.mauza ??
    feature?.properties?.Mauza ??
    feature?.properties?.moza ??
    feature?.properties?.Moza ??
    feature?.properties?.name ??
    feature?.properties?.Name ??
    `Mauza ${getMauzaId(feature) || ""}`
  );
}

function getFeatureAreaLabel(feature) {
  const sqft = readAreaSqft(feature);
  return sqft ? `${formatNumber(sqft)} sq ft` : "-";
}

function getKhasraName(feature) {
  const props = feature?.properties || {};
  return (
    props.join_shp ??
    props.kh ??
    props.KH ??
    props.khasra_no ??
    props.khasra_id ??
    props.name ??
    props.Name ??
    `Khasra ${props.gid || ""}`
  );
}

function getSquareName(feature) {
  const props = feature?.properties || {};
  return (
    props.layer ??
    props.sq ??
    props.square_id ??
    props.name ??
    props.Name ??
    `Square ${props.gid || ""}`
  );
}

function uniqueByMauza(features = []) {
  const seen = new Set();

  return features.filter((feature) => {
    const id = getMauzaId(feature);
    const name = getMauzaName(feature);
    const key = id ?? name;

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMauzaIdsFromFeatures(features = []) {
  return [...new Set(features.map(getMauzaId).filter((id) => id !== null))];
}

function fitToGeojson(map, geojson) {
  if (!map || !geojson?.features?.length) return;

  const bbox = geojson?.bbox;
  if (
    Array.isArray(bbox) &&
    bbox.length >= 4 &&
    bbox.slice(0, 4).every((value) => Number.isFinite(Number(value)))
  ) {
    // map.fitBounds(
    //   [
    //     [Number(bbox[0]), Number(bbox[1])],
    //     [Number(bbox[2]), Number(bbox[3])],
    //   ],
    //   { padding: 40, duration: 900 },
    // );
    return;
  }

  // Fallback for older endpoints that do not return a FeatureCollection bbox.
  // This coordinate walk is intentionally avoided for RUDA Khasra responses
  // because large cadastral geometries can freeze the browser main thread.
  import("mapbox-gl").then((m) => {
    const bounds = new m.default.LngLatBounds();

    geojson.features.forEach((feature) => {
      const traverse = (coords) => {
        if (!coords) return;
        if (
          typeof coords?.[0] === "number" &&
          typeof coords?.[1] === "number"
        ) {
          bounds.extend(coords);
          return;
        }
        if (Array.isArray(coords)) coords.forEach(traverse);
      };

      traverse(feature.geometry?.coordinates);
    });

    // if (!bounds.isEmpty()) {
    //   map.fitBounds(bounds, { padding: 40, duration: 900 });
    // }
  });
}

function getKhasraTileUrl() {
  const base = String(API_BASE || "").replace(/\/$/, "");
  return `${base}/rudakhasra/tiles/{z}/{x}/{y}/`;
}

function removeKhasraMapLayers(map) {
  if (!map) return;

  [IDS.khasra.label, IDS.khasra.line, IDS.khasra.fill].forEach((layerId) => {
    try {
      if (layerId && map.getLayer(layerId)) map.removeLayer(layerId);
    } catch (_) {}
  });
}

function ensureKhasraVectorLayer(map, opacity, color) {
  if (!map) return;

  const sourceId = KHASRA_VECTOR_SOURCE_ID;
  const existingSource = map.getSource(sourceId);
  const existingSourceType = map.getStyle?.()?.sources?.[sourceId]?.type;

  // During hot reload, or after previously using the old GeoJSON code, the
  // same source id may still point to a GeoJSON source. Replace only that
  // Khasra source so Mapbox can use vector tiles.
  if (existingSource && existingSourceType !== "vector") {
    removeKhasraMapLayers(map);
    try {
      map.removeSource(sourceId);
    } catch (_) {}
  }

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      tiles: [getKhasraTileUrl()],
      minzoom: KHASRA_MIN_ZOOM,
      maxzoom: 18,
      promoteId: "gid",
    });
  }

  const beforeId = getLandRevenueBeforeId(map);
  const visibility = "visible";
  const opacityRatio = Math.max(0, Math.min(Number(opacity) / 100, 1));

  if (!map.getLayer(IDS.khasra.fill)) {
    map.addLayer(
      {
        id: IDS.khasra.fill,
        type: "fill",
        source: sourceId,
        "source-layer": KHASRA_SOURCE_LAYER,
        minzoom: KHASRA_MIN_ZOOM,
        layout: { visibility },
        paint: {
          "fill-color": color,
          "fill-opacity": 0.12 * opacityRatio,
          "fill-antialias": true,
        },
      },
      beforeId,
    );
  }

  if (!map.getLayer(IDS.khasra.line)) {
    map.addLayer(
      {
        id: IDS.khasra.line,
        type: "line",
        source: sourceId,
        "source-layer": KHASRA_SOURCE_LAYER,
        minzoom: KHASRA_MIN_ZOOM,
        layout: { visibility },
        paint: {
          "line-color": color,
          "line-opacity": opacityRatio,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            KHASRA_MIN_ZOOM,
            0.45,
            15,
            1.15,
            18,
            1.8,
          ],
        },
      },
      beforeId,
    );
  }

  if (IDS.khasra.label && !map.getLayer(IDS.khasra.label)) {
    map.addLayer(
      {
        id: IDS.khasra.label,
        type: "symbol",
        source: sourceId,
        "source-layer": KHASRA_SOURCE_LAYER,
        minzoom: KHASRA_MIN_ZOOM,
        layout: {
          visibility,
          "text-field": getLabelExpression("khasra"),
          "text-size": ["interpolate", ["linear"], ["zoom"], KHASRA_MIN_ZOOM, 9, 18, 12],
          "symbol-avoid-edges": true,
          "text-padding": 5,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#24150f",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
          "text-opacity": opacityRatio,
        },
      },
      beforeId,
    );
  }

  [IDS.khasra.fill, IDS.khasra.line, IDS.khasra.label].forEach((layerId) => {
    try {
      if (layerId && map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", "visible");
      }
    } catch (_) {}
  });

  reorderLandRevenueLayers(map);
}

function updateKhasraVectorStyle(map, opacity, color) {
  if (!map) return;

  const opacityRatio = Math.max(0, Math.min(Number(opacity) / 100, 1));

  try {
    if (map.getLayer(IDS.khasra.fill)) {
      map.setPaintProperty(IDS.khasra.fill, "fill-color", color);
      map.setPaintProperty(
        IDS.khasra.fill,
        "fill-opacity",
        0.12 * opacityRatio,
      );
    }
    if (map.getLayer(IDS.khasra.line)) {
      map.setPaintProperty(IDS.khasra.line, "line-color", color);
      map.setPaintProperty(IDS.khasra.line, "line-opacity", opacityRatio);
    }
    if (IDS.khasra.label && map.getLayer(IDS.khasra.label)) {
      map.setPaintProperty(IDS.khasra.label, "text-opacity", opacityRatio);
    }
  } catch (_) {}
}

// RUDA Khasra is rendered directly from vector tiles for the current viewport.
// Do not auto-fit a project-wide extent when the individual checkbox is clicked.
// Previously a call to a commented-out fitToKhasraExtent() threw a ReferenceError
// and the catch block immediately hid Khasra again.

function addOrUpdatePolygonLayer(map, key, geojson, opacity, color, mauzaSizes = null) {
  const config = BOUNDARY_LAYER_CONFIG[key];
  if (!map || !config || !geojson) return;

  config.addLayer(
    map,
    geojson,
    color,
    opacity / 100,
    getLandRevenueBeforeId(map),
    key === "moza" ? mauzaSizes : undefined,
  );

  if (key === "moza") {
    setBasemapMauzaPlaceFilter(
      map, "cadastral-mauza",
      (geojson?.features || []).map(getMauzaName),
    );
  }
  reorderLandRevenueLayers(map);
}

function hideLayer(map, key) {
  if (!map) return;
  if (key === "moza") setBasemapMauzaPlaceFilter(map, "cadastral-mauza", []);

  if (key === "masawi") {
    try {
      if (map.getLayer(MASAWI_LAYER))
        map.setLayoutProperty(MASAWI_LAYER, "visibility", "none");
    } catch (_) {}
    return;
  }

  const ids = IDS[key];
  if (!ids) return;

  try {
    if (map.getLayer(ids.fill))
      map.setLayoutProperty(ids.fill, "visibility", "none");
    if (map.getLayer(ids.line))
      map.setLayoutProperty(ids.line, "visibility", "none");
    if (ids.label && map.getLayer(ids.label))
      map.setLayoutProperty(ids.label, "visibility", "none");
  } catch (_) {}
}

function updateOpacity(map, key, opacity, geojson, color, mauzaSizes = null) {
  if (!map) return;

  if (key === "masawi") {
    try {
      if (map.getLayer(MASAWI_LAYER)) {
        map.setPaintProperty(MASAWI_LAYER, "raster-opacity", opacity / 100);
      }
    } catch (_) {}
    return;
  }

  if (geojson) {
    addOrUpdatePolygonLayer(map, key, geojson, opacity, color, mauzaSizes);
  }
}

function updateColor(map, key, color, geojson, opacity, mauzaSizes = null) {
  if (!map || key === "masawi" || !geojson) return;
  addOrUpdatePolygonLayer(map, key, geojson, opacity, color, mauzaSizes);
}

function addOrUpdateMasawiLayer(map, opacity) {
  if (!map) return;

  if (!map.getSource(MASAWI_SOURCE)) {
    map.addSource(MASAWI_SOURCE, {
      type: "raster",
      tiles: [MASAWI_TILE_URL],
      tileSize: 256,
    });
  }

  if (!map.getLayer(MASAWI_LAYER)) {
    map.addLayer({
      id: MASAWI_LAYER,
      type: "raster",
      source: MASAWI_SOURCE,
      paint: { "raster-opacity": opacity / 100 },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(MASAWI_LAYER, "visibility", "visible");
    map.setPaintProperty(MASAWI_LAYER, "raster-opacity", opacity / 100);
  }

  // map.fitBounds(MASAWI_BOUNDS, { padding: 50, duration: 1500 });
}

export default function Cadastral({ map, selectedProjectId }) {
  const [mauzas, setMauzas] = useState([]);
  const [selectedMauzas, setSelectedMauzas] = useState([]);
  const [mauzaPanelOpen, setMauzaPanelOpen] = useState(false);
  const [khasraPanelOpen, setKhasraPanelOpen] = useState(false);
  const [khasraMauzas, setKhasraMauzas] = useState([]);
  const [visibleKhasraGeojson, setVisibleKhasraGeojson] = useState(emptyFC);
  const [open, setOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null);
  const [mauzaSizeDialog, setMauzaSizeDialog] = useState(null);
  const [mauzaSizes, setMauzaSizes] = useState({ lineWidth: null, labelSize: null });
  // Keep a synchronous reference so in-flight GeoJSON loads use the latest sizes.
  const mauzaSizesRef = useRef(mauzaSizes);
  const [extraDetailsOpen, setExtraDetailsOpen] = useState({});
  const [possessionTypeVisibility, setPossessionTypeVisibility] = useState(
    () => ({ ...DEFAULT_POSSESSION_TYPE_VISIBILITY }),
  );

  const possessionTypeVisibilityRef = useRef(possessionTypeVisibility);
  possessionTypeVisibilityRef.current = possessionTypeVisibility;

  const cachedData = useRef({});
  const boundaryRequests = useRef({});
  const extraLayerRequests = useRef({});

  const [layers, setLayers] = useState(() =>
    Object.fromEntries(
      ALL_CADASTRAL_LAYER_DEFS.map((d) => [
        d.key,
        { visible: false, opacity: 100, color: d.color, loading: false },
      ]),
    ),
  );

  const layersRef = useRef(layers);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const selectedProjectKey = selectedProjectId ? String(selectedProjectId) : "";
  const hasSelectedProject = Boolean(selectedProjectKey);

  const applyMauzaSize = (kind, numericValue) => {
    const limits = MAUZA_SIZE_LIMITS[kind];
    if (!limits || !Number.isFinite(numericValue) || numericValue < limits.min || numericValue > limits.max) return;

    const field = kind === "line" ? "lineWidth" : "labelSize";
    const nextSizes = { ...mauzaSizesRef.current, [field]: numericValue };
    mauzaSizesRef.current = nextSizes;
    setMauzaSizes(nextSizes);
    setMauzaSizeDialog(null);

    // Update immediately: do not need to reload Mauza GeoJSON or change colors.
    if (!map || !layersRef.current.moza?.visible) return;
    try {
      if (kind === "line" && map.getLayer(MAUZA_BOUNDARY_IDS.line)) {
        map.setPaintProperty(MAUZA_BOUNDARY_IDS.line, "line-width", numericValue);
      }
      if (kind === "label" && map.getLayer(MAUZA_BOUNDARY_IDS.label)) {
        map.setLayoutProperty(MAUZA_BOUNDARY_IDS.label, "text-size", numericValue);
      }
    } catch (error) {
      console.warn("Mauza size will be applied when the layer is next drawn:", error);
    }
  };

  const setVisible = (key, visible) => {
    layersRef.current = {
      ...layersRef.current,
      [key]: { ...layersRef.current[key], visible },
    };
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], visible } }));
  };

  const setOpacity = (key, opacity) => {
    const currentState = layersRef.current[key];
    layersRef.current = {
      ...layersRef.current,
      [key]: { ...currentState, opacity },
    };
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity } }));

    if (EXTRA_LAYER_CONFIG[key]) {
      const geojson = cachedData.current[key];
      if (geojson && currentState?.visible) {
        const displayGeoJSON =
          key === "possessionLand"
            ? filterPossessionLandGeoJSON(geojson, possessionTypeVisibility)
            : geojson;

        EXTRA_LAYER_CONFIG[key].addLayer(
          map,
          displayGeoJSON,
          currentState.color,
          opacity / 100,
        );
      }
      return;
    }

    if (key === "khasra") {
      updateKhasraVectorStyle(map, opacity, currentState?.color);
      return;
    }

    const geojson = key === "moza" ? mauzaGeojson : cachedData.current[key];
    updateOpacity(map, key, opacity, geojson, currentState?.color, mauzaSizesRef.current);
  };

  const setColor = (key, color) => {
    const currentState = layersRef.current[key];
    layersRef.current = {
      ...layersRef.current,
      [key]: { ...currentState, color },
    };
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], color } }));

    if (EXTRA_LAYER_CONFIG[key]) {
      const geojson = cachedData.current[key];
      if (geojson && currentState?.visible) {
        const displayGeoJSON =
          key === "possessionLand"
            ? filterPossessionLandGeoJSON(geojson, possessionTypeVisibility)
            : geojson;

        EXTRA_LAYER_CONFIG[key].addLayer(
          map,
          displayGeoJSON,
          color,
          currentState.opacity / 100,
        );
      }
      return;
    }

    if (key === "khasra") {
      updateKhasraVectorStyle(map, currentState?.opacity ?? 100, color);
      return;
    }

    const geojson = key === "moza" ? mauzaGeojson : cachedData.current[key];
    updateColor(map, key, color, geojson, currentState?.opacity ?? 100, mauzaSizesRef.current);
  };

  const setLoading = (key, loading) => {
    layersRef.current = {
      ...layersRef.current,
      [key]: { ...layersRef.current[key], loading },
    };
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], loading } }));
  };

  const activeMauzaFeatures = useMemo(() => {
    if (!mauzas.length) return [];
    return mauzas.filter((feature) =>
      selectedMauzas.includes(getMauzaId(feature)),
    );
  }, [mauzas, selectedMauzas]);

  const activeMauzaIds = useMemo(
    () => getMauzaIdsFromFeatures(activeMauzaFeatures),
    [activeMauzaFeatures],
  );

  const mauzaGeojson = useMemo(
    () => ({ type: "FeatureCollection", features: activeMauzaFeatures }),
    [activeMauzaFeatures],
  );

  const khasraGeojson = visibleKhasraGeojson;
  const squareGeojson = cachedData.current.square || emptyFC();

  const loadProjectMauzas = async ({ draw = false, zoom = false } = {}) => {
    if (!map) return emptyFC();

    if (cachedData.current.moza?.features?.length) {
      const cachedGeojson = cachedData.current.moza;

      if (draw && layersRef.current.moza?.visible) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          cachedGeojson,
          layersRef.current.moza.opacity,
          layersRef.current.moza.color,
          mauzaSizesRef.current,
        );
        if (zoom) fitToGeojson(map, cachedGeojson);
      }

      return cachedGeojson;
    }

    setLoading("moza", true);

    try {
      // Fetch the complete Mauza model with no project or tehsil filter.
      const response = await axios.get(`${API_BASE}/rudamauza/`);
      const geojson = unwrapGeoJSON(response.data);
      const allMauzas = uniqueByMauza(geojson?.features || []);
      const completeMauzaGeojson = {
        type: "FeatureCollection",
        features: allMauzas,
      };

      cachedData.current.moza = completeMauzaGeojson;

      const allMauzaIds = getMauzaIdsFromFeatures(allMauzas);
      setMauzas(allMauzas);
      setSelectedMauzas(allMauzaIds);

      if (draw && layersRef.current.moza?.visible) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          completeMauzaGeojson,
          layersRef.current.moza.opacity,
          layersRef.current.moza.color,
          mauzaSizesRef.current,
        );
        if (zoom) fitToGeojson(map, completeMauzaGeojson);
      }

      return completeMauzaGeojson;
    } catch (error) {
      console.error("Complete Mauza model load error:", error);
      return emptyFC();
    } finally {
      setLoading("moza", false);
    }
  };

  const loadMauzas = async ({ zoom = true } = {}) => {
    return loadProjectMauzas({ draw: true, zoom });
  };

  const loadKhasraTiles = async () => {
    if (!map) return emptyFC();

    setLoading("khasra", true);

    try {
      // The Khasra geometry comes from the viewport's vector tiles, NOT from
      // the extent endpoint. Load the same way for an individual checkbox and
      // the Cadastral master toggle. No extra extent request or camera change.
      if (!layersRef.current.khasra?.visible) return visibleKhasraGeojson;

      ensureKhasraVectorLayer(
        map,
        layersRef.current.khasra.opacity,
        layersRef.current.khasra.color,
      );
      setKhasraPanelOpen("khasra");

      return visibleKhasraGeojson;
    } catch (error) {
      console.error("RUDA Khasra vector-tile load error:", error);
      hideLayer(map, "khasra");
      setVisible("khasra", false);
      return emptyFC();
    } finally {
      setLoading("khasra", false);
    }
  };

  const loadBoundaryByMauzas = async (key, _mauzaIds, { zoom = true } = {}) => {
    if (!map) return emptyFC();

    const cachedGeojson = cachedData.current[key];
    if (cachedGeojson?.features) {
      if (!layersRef.current[key]?.visible) return cachedGeojson;

      addOrUpdatePolygonLayer(
        map,
        key,
        cachedGeojson,
        layersRef.current[key].opacity,
        layersRef.current[key].color,
      );

      if (zoom) fitToGeojson(map, cachedGeojson);

      if (key === "khasra") {
        setKhasraPanelOpen("khasra");
      }

      return cachedGeojson;
    }

    // Reuse the same promise when the checkbox is clicked repeatedly while a
    // large GeoJSON response is still downloading/parsing.
    if (boundaryRequests.current[key]) {
      return boundaryRequests.current[key];
    }

    setLoading(key, true);

    const requestPromise = (async () => {
      try {
        const endpoint = key === "khasra" ? "/rudakhasra/" : "/rudasquare/";
        const response = await axios.get(`${API_BASE}${endpoint}`);
        const geojson = unwrapBoundaryGeoJSON(response.data);

        cachedData.current[key] = geojson;

        if (!layersRef.current[key]?.visible) return geojson;

        addOrUpdatePolygonLayer(
          map,
          key,
          geojson,
          layersRef.current[key].opacity,
          layersRef.current[key].color,
        );

        if (zoom) fitToGeojson(map, geojson);

        if (key === "khasra") {
          setKhasraPanelOpen("khasra");
        }

        return geojson;
      } catch (error) {
        console.error(`Complete ${key} model load error:`, error);
        setVisible(key, false);
        return emptyFC();
      } finally {
        delete boundaryRequests.current[key];
        setLoading(key, false);
      }
    })();

    boundaryRequests.current[key] = requestPromise;
    return requestPromise;
  };

  const ensureProjectMauzas = async () => {
    if (mauzas.length) {
      return { ids: activeMauzaIds, features: activeMauzaFeatures };
    }

    const loaded = await loadProjectMauzas({ draw: false, zoom: false });
    const features = loaded.features || [];
    return { ids: getMauzaIdsFromFeatures(features), features };
  };

  const loadExtraLayer = async (key, { zoom = true } = {}) => {
    const config = EXTRA_LAYER_CONFIG[key];
    if (!map || !config) return emptyFC();

    setLoading(key, true);

    try {
      let geojson = cachedData.current[key];

      if (!geojson) {
        if (!extraLayerRequests.current[key]) {
          extraLayerRequests.current[key] = (async () => {
            try {
              const response = await axios.get(`${API_BASE}${config.endpoint}`);
              const loadedGeoJSON = unwrapGeoJSON(response.data);
              cachedData.current[key] = loadedGeoJSON;
              return loadedGeoJSON;
            } finally {
              delete extraLayerRequests.current[key];
            }
          })();
        }

        geojson = await extraLayerRequests.current[key];
      }

      if (!layersRef.current[key]?.visible) return geojson;

      const displayGeoJSON =
        key === "possessionLand"
          ? filterPossessionLandGeoJSON(geojson, possessionTypeVisibility)
          : geojson;
      const currentState = layersRef.current[key];

      config.addLayer(
        map,
        displayGeoJSON,
        currentState.color,
        currentState.opacity / 100,
      );
      setExtraVisibility(map, key, true);

      if (key === "possessionLand") {
        setExtraDetailsOpen((prev) => ({
          ...prev,
          possessionLand: true,
        }));
      }
      if (zoom) fitToExtraGeoJSON(map, displayGeoJSON);

      return geojson;
    } catch (error) {
      console.error(`${key} cadastral layer load error:`, error);
      setVisible(key, false);
      return emptyFC();
    } finally {
      setLoading(key, false);
    }
  };

  const handleVisible = async (key, visible) => {
    const isExtraLayer = Boolean(EXTRA_LAYER_CONFIG[key]);

    if (!map) {
      setVisible(key, visible);
      return;
    }

    if (!visible) {
      setVisible(key, false);

      if (isExtraLayer) {
        setExtraVisibility(map, key, false);
        if (key === "possessionLand") {
          setExtraDetailsOpen((prev) => ({
            ...prev,
            possessionLand: false,
          }));
        }
        return;
      }

      hideLayer(map, key);

      if (key === "moza") {
        setMauzaPanelOpen(false);
      }

      if (key === "khasra") {
        setKhasraPanelOpen(false);
        setKhasraMauzas([]);
      }

      return;
    }

    setVisible(key, true);

    if (isExtraLayer) {
      await loadExtraLayer(key);
      return;
    }

    if (key === "moza") {
      await loadMauzas();
      return;
    }

    if (key === "khasra") {
      await loadKhasraTiles();
      return;
    }

    if (key === "square") {
      await loadBoundaryByMauzas(key, [], { zoom: true });
    }
  };

  const handlePossessionTypeVisible = (typeKey, visible) => {
    const nextVisibility = {
      ...possessionTypeVisibility,
      [typeKey]: visible,
    };

    setPossessionTypeVisibility(nextVisibility);

    const geojson = cachedData.current.possessionLand;
    const possessionState = layersRef.current.possessionLand;
    if (!map || !geojson || !possessionState?.visible) return;

    addPossessionLandLayer(
      map,
      filterPossessionLandGeoJSON(geojson, nextVisibility),
      possessionState.color,
      possessionState.opacity / 100,
    );
    setExtraVisibility(map, "possessionLand", true);
  };

  useEffect(() => {
    if (!map || !layers.moza.visible) return;
    addOrUpdatePolygonLayer(
      map,
      "moza",
      mauzaGeojson,
      layers.moza.opacity,
      layers.moza.color,
      mauzaSizesRef.current,
    );
  }, [map, mauzaGeojson, layers.moza.visible]);

  // A basemap/style change removes custom Mapbox layers; restore Mauza with
  // the user's selected line width and label size when the new style is ready.
  useEffect(() => {
    if (!map) return;

    const restoreMauzaOnStyleLoad = () => {
      const state = layersRef.current.moza;
      if (!state?.visible || !mauzaGeojson?.features?.length) return;
      try {
        addOrUpdatePolygonLayer(
          map, "moza", mauzaGeojson, state.opacity, state.color,
          mauzaSizesRef.current,
        );
      } catch (error) {
        console.warn("Mauza styling could not be restored:", error);
      }
    };

    map.on("style.load", restoreMauzaOnStyleLoad);
    return () => map.off("style.load", restoreMauzaOnStyleLoad);
  }, [map, mauzaGeojson]);

  useEffect(() => {
    if (!map || !layers.khasra.visible) return;

    let frameId = null;

    const syncVisibleFeatures = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        frameId = null;

        try {
          if (!map.getSource(KHASRA_VECTOR_SOURCE_ID)) return;

          const sourceFeatures = map.querySourceFeatures(
            KHASRA_VECTOR_SOURCE_ID,
            {
              sourceLayer: KHASRA_SOURCE_LAYER,
            },
          );
          const seen = new Set();
          const features = [];

          sourceFeatures.forEach((feature) => {
            const properties = { ...(feature?.properties || {}) };
            const id = feature?.id ?? properties.gid;
            const uniqueId = id ?? `${properties.khasra_id}-${properties.kh}`;

            if (
              uniqueId === null ||
              uniqueId === undefined ||
              seen.has(uniqueId)
            ) {
              return;
            }

            seen.add(uniqueId);
            features.push({
              type: "Feature",
              id,
              geometry: feature.geometry,
              properties,
            });
          });

          const geojson = { type: "FeatureCollection", features };
          cachedData.current.khasra = geojson;
          setVisibleKhasraGeojson(geojson);
        } catch (_) {}
      });
    };

    const restoreAfterStyleChange = () => {
      if (!layersRef.current.khasra?.visible) return;
      if (
        map.getSource(KHASRA_VECTOR_SOURCE_ID) &&
        [IDS.khasra.fill, IDS.khasra.line, IDS.khasra.label].every((id) => !id || map.getLayer(id))
      ) return;
      try {
        ensureKhasraVectorLayer(
          map,
          layersRef.current.khasra.opacity,
          layersRef.current.khasra.color,
        );
      } catch (error) { console.warn("Khasra map style restore failed:", error); }
    };

    const handleSourceData = (event) => {
      if (event?.sourceId === KHASRA_VECTOR_SOURCE_ID) syncVisibleFeatures();
    };

    restoreAfterStyleChange();
    map.on("sourcedata", handleSourceData);
    map.on("moveend", syncVisibleFeatures);
    map.on("zoomend", syncVisibleFeatures);
    map.on("style.load", restoreAfterStyleChange);
    syncVisibleFeatures();

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      map.off("sourcedata", handleSourceData);
      map.off("moveend", syncVisibleFeatures);
      map.off("zoomend", syncVisibleFeatures);
      map.off("style.load", restoreAfterStyleChange);
    };
  }, [map, layers.khasra.visible, layers.khasra.opacity, layers.khasra.color]);

  // Mapbox setStyle() removes custom sources and layers. Re-add the remaining
  // enabled cadastral layers, not only Mauza and Khasra.
  useEffect(() => {
    if (!map) return;
    const restoreCadastral = () => {
      const squareState = layersRef.current.square;
      const squareData = cachedData.current.square;
      if (squareState?.visible && squareData?.features?.length) {
        try {
          addOrUpdatePolygonLayer(map, "square", squareData, squareState.opacity, squareState.color);
        } catch (error) { console.warn("Square restore failed:", error); }
      }
      EXTRA_LAYER_DEFS.forEach(({ key }) => {
        const state = layersRef.current[key];
        const data = cachedData.current[key];
        if (!state?.visible || !data?.features?.length) return;
        try {
          EXTRA_LAYER_CONFIG[key].addLayer(
            map,
            key === "possessionLand" ? filterPossessionLandGeoJSON(data, possessionTypeVisibilityRef.current) : data,
            state.color,
            state.opacity / 100,
          );
        } catch (error) { console.warn(`${key} restore failed:`, error); }
      });
    };
    map.on("style.load", restoreCadastral);
    return () => map.off("style.load", restoreCadastral);
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      reorderLandRevenueLayers(map);
    };

    map.on("styledata", handleStyleData);
    reorderLandRevenueLayers(map);

    return () => {
      map.off("styledata", handleStyleData);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    cachedData.current = {};
    boundaryRequests.current = {};
    extraLayerRequests.current = {};
    setMauzas([]);
    setSelectedMauzas([]);
    setKhasraMauzas([]);
    setVisibleKhasraGeojson(emptyFC());
    setMauzaPanelOpen(false);
    setKhasraPanelOpen(false);
    setOpen(false);
    setActiveTable(null);
    setExtraDetailsOpen({});
    setPossessionTypeVisibility({ ...DEFAULT_POSSESSION_TYPE_VISIBILITY });

    ["moza", "square", "khasra"].forEach((key) => hideLayer(map, key));
    EXTRA_LAYER_DEFS.forEach(({ key }) => setExtraVisibility(map, key, false));

    setLayers((prev) => ({
      ...prev,
      moza: { ...prev.moza, visible: false, loading: false },
      square: { ...prev.square, visible: false, loading: false },
      khasra: { ...prev.khasra, visible: false, loading: false },
      awardedLand: {
        ...prev.awardedLand,
        visible: false,
        loading: false,
      },
      stateLand: {
        ...prev.stateLand,
        visible: false,
        loading: false,
      },
      possessionLand: {
        ...prev.possessionLand,
        visible: false,
        loading: false,
      },
    }));
  }, [map]);

  const renderBoundaryRow = ({ key, label, color, dropdown }) => {
    const isKhasra = key === "khasra";
    const isSquare = key === "square";
    const isMasawi = key === "masawi";
    const boundaryFeatures =
      key === "khasra"
        ? visibleKhasraGeojson.features || []
        : key === "square"
          ? cachedData.current.square?.features || []
          : [];

    return (
      <div key={key}>
        <LayerItem
          key={key}
          checked={layers[key].visible}
          color={layers[key].color || color}
          label={label}
          loading={layers[key].loading}
          opacity={layers[key].opacity}
          hasDropdown={dropdown || isSquare || isMasawi}
          hasTable={isKhasra || isSquare}
          dropdownOpen={
            (isKhasra || isSquare || isMasawi) && khasraPanelOpen === key
          }
          dropdownTitle={`Show ${label} details`}
          onChange={(checked) => handleVisible(key, checked)}
          onOpacityChange={(opacity) => setOpacity(key, opacity)}
          onColorChange={(value) => setColor(key, value)}
          colorEditable={key !== "masawi"}
          onDropdownToggle={() =>
            setKhasraPanelOpen((prev) => (prev === key ? false : key))
          }
          onTableOpen={() => setActiveTable(key)}
        >
          {(isKhasra || isSquare || isMasawi) && khasraPanelOpen === key && (
            <div
              className={`max-h-32 border-t border-white/10 px-3 py-1.5 ${LAYER_PANEL_SCROLL}`}
              onClick={(event) => event.stopPropagation()}
            >
              {isMasawi ? (
                <div className="flex items-center gap-2 py-1 text-[11px] text-white/85">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: layers.masawi.color }}
                  />
                  <span className="truncate">
                    Handu Gujran Masawi / Ortho Image
                  </span>
                </div>
              ) : !layers[key].visible ? (
                <div className="py-1 text-[11px] text-white/45">
                  Turn on {label} to view opened records.
                </div>
              ) : !boundaryFeatures.length && !layers[key].loading ? (
                <div className="py-1 text-[11px] text-white/45">
                  No {label.toLowerCase()} records were returned by the model.
                </div>
              ) : (
                <>
                  {isKhasra && (
                    <div className="mb-1 border-b border-white/10 pb-1 text-[10px] text-white/45">
                      Showing{" "}
                      {Math.min(
                        boundaryFeatures.length,
                        KHASRA_VISIBLE_LIST_LIMIT,
                      )}{" "}
                      of {boundaryFeatures.length} Khasras currently loaded in the
                      map view.
                    </div>
                  )}
                  {boundaryFeatures
                    .slice(0, isKhasra ? KHASRA_VISIBLE_LIST_LIMIT : undefined)
                    .map((feature, index) => {
                      const props = feature?.properties || {};
                      const displayName = isKhasra
                        ? getKhasraName(feature)
                        : `${getSquareName(feature)}${props.mauza ? ` - ${props.mauza}` : ""}`;

                      return (
                        <div
                          key={`${key}-${props.gid || feature.id || index}`}
                          className="flex items-center gap-2 py-1 text-[11px] text-white/85"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: layers[key].color }}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {displayName}
                          </span>
                          <span className="shrink-0 text-white/50">
                            {getFeatureAreaLabel(feature)}
                          </span>
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          )}
        </LayerItem>

        {/* Inline legend for boundary layers (not raster Masawi) */}
        {layers[key].visible && !isMasawi && (
          <InlineLayerLegend
            items={[lineLegend(label, layers[key].color || color, { width: 1.5 })]}
            opacity={layers[key].opacity}
          />
        )}
      </div>
    );
  };

  const renderExtraLayerRow = (definition) => {
    const { key, label, color } = definition;
    const detailsOpen = Boolean(extraDetailsOpen[key]);
    const featureCount = cachedData.current[key]?.features?.length || 0;
    const isPossessionLayer = key === "possessionLand";

    return (
      <div key={key}>
        <LayerItem
          key={key}
          checked={layers[key].visible}
          color={layers[key].color || color}
          label={label}
          loading={layers[key].loading}
          opacity={layers[key].opacity}
          hasDropdown
          hasTable
          dropdownOpen={detailsOpen}
          dropdownTitle={
            isPossessionLayer
              ? "Show possession land types"
              : `Show ${label} details`
          }
          onChange={(checked) => handleVisible(key, checked)}
          onOpacityChange={(opacity) => setOpacity(key, opacity)}
          onColorChange={(value) => setColor(key, value)}
          colorEditable={!isPossessionLayer}
          onDropdownToggle={() =>
            setExtraDetailsOpen((prev) => ({
              ...prev,
              [key]: !prev[key],
            }))
          }
          onTableOpen={() => setActiveTable(key)}
        >
          {detailsOpen && isPossessionLayer && (
            <div
              className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2"
              onClick={(event) => event.stopPropagation()}
            >
              {POSSESSION_LAND_TYPES.map((type) => {
                const typeCount = countPossessionLandTypeFeatures(
                  cachedData.current.possessionLand,
                  type.value,
                );

                return (
                  <label
                    key={type.key}
                    className={`flex items-center gap-2 py-1 text-[11px] ${
                      layers.possessionLand.visible
                        ? "cursor-pointer text-white/85 hover:text-white"
                        : "cursor-not-allowed text-white/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(possessionTypeVisibility[type.key])}
                      disabled={!layers.possessionLand.visible}
                      onChange={(event) =>
                        handlePossessionTypeVisible(
                          type.key,
                          event.target.checked,
                        )
                      }
                      className="accent-[#65c96b] disabled:cursor-not-allowed"
                    />
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/35"
                      style={{ backgroundColor: type.lineColor }}
                    />
                    <span className="min-w-0 flex-1 truncate">{type.value}</span>
                    <span className="shrink-0 text-white/45">{typeCount}</span>
                  </label>
                );
              })}
            </div>
          )}

          {detailsOpen && !isPossessionLayer && (
            <div
              className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex justify-between">
                <span>Total Features</span>
                <span>{featureCount}</span>
              </div>
            </div>
          )}
        </LayerItem>

        {/* Inline legend for land polygon layers */}
        {layers[key].visible && (
          isPossessionLayer ? (
            <InlineLayerLegend
              items={POSSESSION_LAND_TYPES
                .filter((type) => possessionTypeVisibility[type.key])
                .map((type) => ({
                  id: type.key,
                  label: type.value,
                  type: "polygon",
                  color: type.lineColor,
                  fillColor: type.lineColor,
                  borderColor: type.lineColor,
                }))}
              opacity={layers[key].opacity}
            />
          ) : (
            <InlineLayerLegend
              items={[polygonLegend(label, layers[key].color || color)]}
              opacity={layers[key].opacity}
            />
          )
        )}
      </div>
    );
  };

  const allCadastralOn = ALL_CADASTRAL_LAYER_DEFS.every(
    (d) => layers[d.key]?.visible,
  );
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkGeneration = useRef(0);

  const toggleAllCadastral = (e) => {
    e.stopPropagation();
    // Never serialize six network requests: a slow Mauza/Square response used
    // to block every layer after it. Update all checkboxes immediately.
    // The group toggle remains usable while loading to cancel/hide layers.
    const next = !ALL_CADASTRAL_LAYER_DEFS.every(
      (definition) => layersRef.current[definition.key]?.visible,
    );
    for (const { key } of ALL_CADASTRAL_LAYER_DEFS) {
      setVisible(key, next);
      if (!next) {
        if (EXTRA_LAYER_CONFIG[key]) setExtraVisibility(map, key, false);
        else hideLayer(map, key);
      }
    }
    const generation = ++bulkGeneration.current;
    if (!next) {
      setMauzaPanelOpen(false);
      setKhasraPanelOpen(false);
      setExtraDetailsOpen({});
      setBulkLoading(false);
      return;
    }

    setBulkLoading(true);
    // Limit concurrency to avoid allocating all large GeoJSON datasets in
    // Chrome at once. The six checkboxes update together, while the layers
    // load independently; a new OFF request cancels work not yet started.
    const jobs = [
      { key: "khasra", load: () => loadKhasraTiles() },
      { key: "moza", load: () => loadMauzas({ zoom: false }) },
      { key: "square", load: () => loadBoundaryByMauzas("square", [], { zoom: false }) },
      ...EXTRA_LAYER_DEFS.map(({ key }) => ({ key, load: () => loadExtraLayer(key, { zoom: false }) })),
    ];
    let index = 0;
    const worker = async () => {
      while (generation === bulkGeneration.current && index < jobs.length) {
        const job = jobs[index++];
        if (!layersRef.current[job.key]?.visible) continue;
        try { await job.load(); }
        catch (error) { console.error(`Cadastral ${job.key} load failed:`, error); }
      }
    };
    void Promise.all([worker(), worker()]).finally(() => {
      if (generation === bulkGeneration.current) setBulkLoading(false);
    });
  };

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>CADASTRAL</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {/* Toggle-all switch */}
        <button
          type="button"
          title={
            allCadastralOn
              ? "Hide all cadastral layers"
              : "Show all cadastral layers"
          }
          onClick={toggleAllCadastral}
          aria-busy={bulkLoading}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            allCadastralOn ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              allCadastralOn ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerItem
            checked={layers.moza.visible}
            color={layers.moza.color || MAUZA_DEF.color}
            label="Mauza Boundary"
            loading={layers.moza.loading}
            opacity={layers.moza.opacity}
            hasDropdown
            hasTable
            dropdownOpen={mauzaPanelOpen}
            dropdownTitle="Show mauza names"
            onChange={(checked) => handleVisible("moza", checked)}
            onOpacityChange={(opacity) => setOpacity("moza", opacity)}
            onColorChange={(value) => setColor("moza", value)}
            colorEditable
            onTableOpen={() => setActiveTable("moza")}
            onLineWidthOpen={() => setMauzaSizeDialog("line")}
            onLabelSizeOpen={() => setMauzaSizeDialog("label")}
            lineWidthValue={mauzaSizes.lineWidth}
            labelSizeValue={mauzaSizes.labelSize}
            onDropdownToggle={() => {
              setMauzaPanelOpen((prev) => {
                const nextOpen = !prev;
                if (nextOpen && !mauzas.length) {
                  loadProjectMauzas({ draw: false, zoom: false });
                }
                return nextOpen;
              });
            }}
          >
            {mauzaPanelOpen && (
              <div
                className={`max-h-32 border-t border-white/10 px-3 py-1.5 ${LAYER_PANEL_SCROLL}`}
                onClick={(event) => event.stopPropagation()}
              >
                {!layers.moza.visible &&
                  !mauzas.length &&
                  layers.moza.loading && (
                    <div className="py-1 text-[11px] text-white/45">
                      Loading all Mauza records.
                    </div>
                  )}

                {!mauzas.length && !layers.moza.loading && (
                  <div className="py-1 text-[11px] text-white/45">
                    No Mauza records found.
                  </div>
                )}

                {mauzas.map((mauza) => {
                  const id = getMauzaId(mauza);
                  const name = getMauzaName(mauza);

                  return (
                    <label
                      key={`${id}-${name}`}
                      className="flex cursor-pointer items-center gap-2 py-1 text-[11px] text-white/85 hover:text-white"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMauzas.includes(id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setSelectedMauzas((prev) =>
                            checked
                              ? [...new Set([...prev, id])]
                              : prev.filter((selectedId) => selectedId !== id),
                          );
                        }}
                        className="accent-[#712B13]"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {name} - {getFeatureAreaLabel(mauza)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </LayerItem>

          {layers.moza.visible && (
            <InlineLayerLegend
              items={[lineLegend("Mauza Boundary", layers.moza.color || MAUZA_DEF.color, { width: mauzaSizes.lineWidth ?? 1.5 })]}
              opacity={layers.moza.opacity}
            />
          )}

          {LAYER_DEFS.map((definition) => renderBoundaryRow(definition))}
          {EXTRA_LAYER_DEFS.map(renderExtraLayerRow)}
        </div>
      )}

      {mauzaSizeDialog && typeof document !== "undefined" && createPortal(
        <MauzaSizeDialog
          key={mauzaSizeDialog}
          kind={mauzaSizeDialog}
          initialValue={
            (mauzaSizeDialog === "line" ? mauzaSizes.lineWidth : mauzaSizes.labelSize) ??
            DEFAULT_MAUZA_CONTROL_VALUES[mauzaSizeDialog === "line" ? "lineWidth" : "labelSize"]
          }
          onCancel={() => setMauzaSizeDialog(null)}
          onApply={(value) => applyMauzaSize(mauzaSizeDialog, value)}
        />,
        document.body,
      )}

      {activeTable === "moza" && (
        <MauzaBoundaryAttribute
          map={map}
          geojson={mauzaGeojson}
          onClose={() => setActiveTable(null)}
        />
      )}

      {activeTable === "khasra" && (
        <KhasraBoundaryAttribute
          map={map}
          geojson={khasraGeojson}
          onClose={() => setActiveTable(null)}
        />
      )}

      {activeTable === "square" && (
        <SquareBoundaryAttribute
          map={map}
          geojson={squareGeojson}
          onClose={() => setActiveTable(null)}
        />
      )}

      {activeTable === "awardedLand" && (
        <AwardedLandAttribute map={map} onClose={() => setActiveTable(null)} />
      )}

      {activeTable === "stateLand" && (
        <StateLandAttribute map={map} onClose={() => setActiveTable(null)} />
      )}

      {activeTable === "possessionLand" && (
        <PossessionLandAttribute
          map={map}
          onClose={() => setActiveTable(null)}
        />
      )}
    </div>
  );
}

function ColorPickerSquare({ color, label, disabled, onColorChange }) {
  return (
    <span
      className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/35"
      style={{ backgroundColor: color }}
      title={`Change ${label} color`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <input
        type="color"
        value={color}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => onColorChange?.(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  );
}

function LayerItem({
  checked,
  color,
  label,
  loading,
  opacity,
  hasDropdown = false,
  hasTable = false,
  dropdownOpen = false,
  dropdownTitle,
  onChange,
  onOpacityChange,
  onColorChange,
  onDropdownToggle,
  onTableOpen,
  onLineWidthOpen,
  onLabelSizeOpen,
  lineWidthValue,
  labelSizeValue,
  disabled = false,
  colorEditable = false,
  children,
}) {
  return (
    <div
      className={`mt-3 first:mt-1 text-white ${disabled ? "opacity-45" : ""}`}
    >
      <div className="flex items-center justify-between">
        <label
          className={`flex min-w-0 items-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => {
              if (disabled) return;
              onChange(event.target.checked);
            }}
            className="accent-[#65c96b] disabled:cursor-not-allowed"
          />

          {colorEditable ? (
            <ColorPickerSquare
              color={color}
              label={label}
              disabled={disabled}
              onColorChange={onColorChange}
            />
          ) : (
            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-white/35"
              style={{ backgroundColor: color }}
            />
          )}

          <span className="truncate text-[11px]">
            {loading ? (
              <span className="flex items-center gap-1">
                {label}
                <span className="text-[9px] text-white/40 animate-pulse">
                  loading…
                </span>
              </span>
            ) : (
              label
            )}
          </span>
        </label>

        <div className="flex shrink-0 items-center gap-1">
          {onLineWidthOpen && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => { event.stopPropagation(); onLineWidthOpen(); }}
              className="rounded px-1 py-0.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
              title={`Set Mauza line width${lineWidthValue == null ? "" : ` (currently ${lineWidthValue}px)`}`}
              aria-label="Change Mauza Boundary line width"
            >
              <AlignJustify size={14} />
            </button>
          )}
          {onLabelSizeOpen && (
            <button
              type="button"
              disabled={disabled}
              onClick={(event) => { event.stopPropagation(); onLabelSizeOpen(); }}
              className="rounded px-1 py-0.5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
              title={`Set Mauza label size${labelSizeValue == null ? "" : ` (currently ${labelSizeValue}px)`}`}
              aria-label="Change Mauza Boundary label size"
            >
              <CaseSensitive size={16} />
            </button>
          )}
          {hasTable ? (
            <button
              type="button"
              disabled={disabled}
              className="rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/60"
              onClick={(event) => {
                event.stopPropagation();
                if (disabled) return;
                onTableOpen?.();
              }}
              title={`Open ${label} attribute table`}
            >
              <Grid3X3 size={14} />
            </button>
          ) : (
            <Grid3X3 size={14} className="text-white/60" />
          )}

          {hasDropdown && (
            <button
              type="button"
              disabled={disabled}
              className="flex items-center gap-1 rounded px-1 py-0.5 text-white/60 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/60"
              onClick={(event) => {
                event.stopPropagation();
                if (disabled) return;
                onDropdownToggle?.();
              }}
              title={dropdownTitle}
            >
              {dropdownOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          disabled={disabled}
          onChange={(event) => {
            if (disabled) return;
            onOpacityChange(Number(event.target.value));
          }}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b] disabled:cursor-not-allowed"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>

      {children}
    </div>
  );
}


// The layer panel is scrollable. A portal keeps the dialog from being clipped.
function MauzaSizeDialog({ kind, initialValue, onCancel, onApply }) {
  const config = MAUZA_SIZE_LIMITS[kind];
  const [draftValue, setDraftValue] = useState(String(initialValue));
  const parsed = Number(draftValue);
  const valid = draftValue.trim() !== "" && Number.isFinite(parsed) &&
    parsed >= config.min && parsed <= config.max;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="mauza-size-heading" className="w-full max-w-sm rounded-lg border border-[#246e51] bg-[#092a20] p-5 text-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="mauza-size-heading" className="mb-2 text-base font-semibold">{config.title}</h2>
        <p className="mb-4 text-xs text-white/65">
          Enter a size in pixels. Apply to update the Mauza Boundary {kind === "line" ? "outline" : "labels"} on the map. Until a custom value is applied, the existing zoom-based size is retained.
        </p>
        <form onSubmit={(event) => { event.preventDefault(); if (valid) onApply(parsed); }}>
          <label htmlFor="mauza-size-input" className="mb-1 block text-xs font-medium">
            {kind === "line" ? "Line width" : "Label font size"} ({config.unit})
          </label>
          <input
            id="mauza-size-input"
            autoFocus
            type="number"
            min={config.min}
            max={config.max}
            step="any"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            className="w-full rounded border border-white/25 bg-white px-3 py-2 text-sm text-[#0f2922] outline-none focus:ring-2 focus:ring-[#65c96b]"
          />
          <p className="mt-1 text-[11px] text-white/55">Allowed range: {config.min}–{config.max} {config.unit}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded border border-white/30 px-4 py-2 text-xs font-semibold hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={!valid} className="rounded bg-[#65c96b] px-4 py-2 text-xs font-bold text-[#0d3022] hover:bg-[#8adb8f] disabled:cursor-not-allowed disabled:opacity-40">Apply</button>
          </div>
        </form>
      </div>
    </div>
  );
}
