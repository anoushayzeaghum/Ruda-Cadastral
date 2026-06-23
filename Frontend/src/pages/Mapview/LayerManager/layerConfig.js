import * as turf from "@turf/turf";

// Start zoomed out so the globe/world is visible on initial load
export const DEFAULT_CENTER = [69.3451, 30.3753];
export const DEFAULT_ZOOM = 5;

export const KHASRA_SOURCE = "khasra-source";
export const KHASRA_FILL = "khasra-fill";
export const KHASRA_LINE = "khasra-line";
export const KHASRA_LABEL = "khasra-label";

export const MURABBA_SOURCE = "murabba-source";
export const MURABBA_FILL = "murabba-fill";
export const MURABBA_LINE = "murabba-line";
export const MURABBA_LABEL = "murabba-label";

export const SQUARE_LEVEL = "square";
export const ACRE_LEVEL = "acre";

export const SELECTED_SOURCE = "selected-source";
export const SELECTED_FILL = "selected-fill";
export const SELECTED_LINE = "selected-line";
export const SELECTED_CORNER_SOURCE = "selected-corner-source";
export const SELECTED_CORNER_LAYER = "selected-corner-layer";
export const SELECTED_CORNER_BOX_LAYER = "selected-corner-box-layer";
export const SELECTED_CORNER_TEXT_LAYER = "selected-corner-text-layer";

export const CONTROL_POINTS_SOURCE = "control-points-source";
export const CONTROL_POINTS_LAYER = "control-points-layer";

export const TRI_JUNCTION_POINTS_SOURCE = "tri-junction-points-source";
export const TRI_JUNCTION_POINTS_LAYER = "tri-junction-points-layer";
export const TRI_JUNCTION_POINTS_LABEL = "tri-junction-points-label";
export const TRI_JUNCTION_BURJI_LAYER = "tri-junction-burji-layer";
export const TRI_JUNCTION_BURJI_LABEL = "tri-junction-burji-label";
export const TRI_JUNCTION_TRIANGLE_IMAGE = "tri-junction-triangle-marker";

export const FIELD_POINTS_SOURCE = "field-points-source";
export const FIELD_POINTS_LAYER = "field-points-layer";
export const FIELD_POINTS_LABEL = "field-points-label";

export const GEODETIC_NETWORK_SOURCE = "geodetic-network-source";
export const GEODETIC_NETWORK_LAYER = "geodetic-network-layer";
export const GEODETIC_NETWORK_LABEL = "geodetic-network-label";

export const HANDU_GUJRAN_ORTHO_SOURCE = "local-handugujran-ortho-source";
export const HANDU_GUJRAN_ORTHO_LAYER = "local-handugujran-ortho-layer";

export const MEASURE_SOURCE = "measure-source";
export const MEASURE_LINE_LAYER = "measure-line-layer";
export const MEASURE_POINTS_LAYER = "measure-points-layer";
export const MEASURE_LABELS_LAYER = "measure-labels-layer";

export const MEASURE_AREA_SOURCE = "measure-area-source";
export const MEASURE_AREA_FILL_LAYER = "measure-area-fill-layer";
export const MEASURE_AREA_LINE_LAYER = "measure-area-line-layer";
export const MEASURE_AREA_POINTS_LAYER = "measure-area-points-layer";
export const MEASURE_AREA_LABEL_LAYER = "measure-area-label-layer";

export const BEARING_SOURCE = "bearing-source";
export const BEARING_LINE_LAYER = "bearing-line-layer";
export const BEARING_POINTS_LAYER = "bearing-points-layer";
export const BEARING_LABEL_LAYER = "bearing-label-layer";

export const BUFFER_SOURCE = "buffer-source";
export const BUFFER_FILL_LAYER = "buffer-fill-layer";
export const BUFFER_LINE_LAYER = "buffer-line-layer";
export const BUFFER_CENTER_LAYER = "buffer-center-layer";

export const MAP_THEME = {
  fillColor: "#158033",
  fillOpacity: 0.2,
  lineColor: "#1e3a5f",
  lineWidth: 2,
};

export const VECTOR_LAYER_THEME = {
  mauza: {
    fill: "#dbeafe",
    fillOpacity: 0.12,
    line: "#1d4ed8",
    lineWidth: 2.2,
    label: "#1e3a8a",
    labelMinZoom: 11,
  },
  khasra: {
    fill: "#dcfce7",
    fillOpacity: 0.035,
    line: "#16a34a",
    lineWidth: ["interpolate", ["linear"], ["zoom"], 12, 0.9, 16, 1.7, 19, 2.4],
    label: "#166534",
    labelMinZoom: 16,
  },
  murabba: {
    fill: "#dcfce7",
    fillOpacity: 0.04,
    line: "#059669",
    lineWidth: ["interpolate", ["linear"], ["zoom"], 11, 1.0, 15, 1.8, 18, 2.4],
    label: "#065f46",
    labelMinZoom: 14,
  },
  square: {
    fill: "#dcfce7",
    fillOpacity: 0.04,
    line: "#059669",
    lineWidth: ["interpolate", ["linear"], ["zoom"], 11, 1.0, 15, 1.8, 18, 2.4],
    label: "#065f46",
    labelMinZoom: 14,
  },
  acre: {
    fill: "#f3e8ff",
    fillOpacity: 0.04,
    line: "#7c3aed",
    lineWidth: ["interpolate", ["linear"], ["zoom"], 12, 0.9, 16, 1.6, 19, 2.2],
    label: "#581c87",
    labelMinZoom: 15,
  },
  defaultBoundary: {
    fill: "#e0f2fe",
    fillOpacity: 0.06,
    line: "#194c8e",
    lineWidth: 2,
    label: "#1e3a8a",
    labelMinZoom: 12,
  },
  trijunction: {
    triangle: "#dc2626",
    triangleStroke: "#991b1b",
    burjiCircle: "#166534",
    burjiStroke: "#ffffff",
    label: "#991b1b",
    burjiLabel: "#14532d",
  },
  fieldPoints: {
    circle: "#2563eb",
    stroke: "#ffffff",
    label: "#1e3a8a",
  },
  geodeticNetwork: {
    circle: "#1d4ed8",
    stroke: "#dbeafe",
    label: "#0f2f5f",
  },
  controlPoints: {
    circle: "#f59e0b",
    stroke: "#78350f",
    label: "#92400e",
  },
};

export const clampOpacity = (value, fallback = 100) => {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) ? number : fallback;
  return Math.max(0, Math.min(1, safeNumber / 100));
};

export const getPointLabelLayerId = (layerId) => `${layerId}-label`;

export const makeLabelExpression = (fields = [], fallback = "") => [
  "to-string",
  ["coalesce", ...fields.map((field) => ["get", field]), fallback],
];

export const VECTOR_LABEL_FIELDS = {
  mauza: makeLabelExpression(["mauza", "Mauza", "MAUZA", "name", "Name"]),
  khasra: makeLabelExpression(["kh", "KH", "k", "K", "khasra", "khasra_no", "khasra_id", "name"]),
  murabba: makeLabelExpression(["m", "M", "mn", "murabba", "murabba_no", "murabba_id", "name"]),
  square: makeLabelExpression(["sq", "SQ", "square", "square_no", "name", "gid"]),
  acre: makeLabelExpression(["acre", "acre_no", "ac", "name", "gid"]),
  trijunction: [
    "to-string",
    [
      "coalesce",
      ["get", "name"],
      ["get", "code"],
      ["get", "point_no"],
      [
        "concat",
        ["coalesce", ["get", "m1"], ["get", "M1"], ["get", "moza1"], ["get", "mauza1"], ""],
        " / ",
        ["coalesce", ["get", "m2"], ["get", "M2"], ["get", "moza2"], ["get", "mauza2"], ""],
        " / ",
        ["coalesce", ["get", "m3"], ["get", "M3"], ["get", "moza3"], ["get", "mauza3"], ""],
      ],
      "",
    ],
  ],
  fieldPoints: makeLabelExpression(["name", "Name", "code", "Code", "point_no", "gm_type", "gid"]),
  geodeticNetwork: makeLabelExpression(["name", "Name", "NAME", "code", "Code", "CODE"]),
};

export const getBoundaryTheme = (level) => {
  if (level === "mauza") return VECTOR_LAYER_THEME.mauza;
  if (level === "murabba") return VECTOR_LAYER_THEME.murabba;
  if (level === SQUARE_LEVEL) return VECTOR_LAYER_THEME.square;
  if (level === ACRE_LEVEL) return VECTOR_LAYER_THEME.acre;
  return VECTOR_LAYER_THEME.defaultBoundary;
};

export const getBoundaryLabelExpression = (level) => {
  if (level === "mauza") return VECTOR_LABEL_FIELDS.mauza;
  if (level === "murabba") return VECTOR_LABEL_FIELDS.murabba;
  if (level === SQUARE_LEVEL) return VECTOR_LABEL_FIELDS.square;
  if (level === ACRE_LEVEL) return VECTOR_LABEL_FIELDS.acre;
  return null;
};

export const ROAD_LEGEND_ITEMS = [
  { label: "Primary Roads (300'-Wide)", color: "#c92020", width: 2 },
  { label: "Secondary Road (200'-Wide)", color: "#4caf50", width: 3 },
  { label: "Tertiary Roads", color: "#ff9800", width: 3 },
  { label: "Tertiary Roads (80'-Wide)", color: "#ff5722", width: 2.5 },
  { label: "Uti Walk Cycle", color: "#8bc34a", width: 2 },
  { label: "Bridge", color: "#75008a", width: 5 },
  { label: "300' CL", color: "#9b2400", width: 2 },
  { label: "300' ROW", color: "#00bcd4", width: 2.5 },
];

export const ROAD_COLOR_EXPRESSION = [
  "match",
  ["get", "layer"],
  ...ROAD_LEGEND_ITEMS.flatMap((item) => [item.label, item.color]),
  "#555555",
];

export const ROAD_WIDTH_EXPRESSION = [
  "match",
  ["get", "layer"],
  ...ROAD_LEGEND_ITEMS.flatMap((item) => [item.label, item.width]),
  2.5,
];

export const RUDA_PHASE_COLORS = [
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

export const hashString = (value = "") => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getRudaPhaseColor = (phaseId) => {
  const index = Math.abs(Number(phaseId) || hashString(phaseId || "ruda"));
  return RUDA_PHASE_COLORS[index % RUDA_PHASE_COLORS.length];
};

export const getRudaPhaseIdFromLevel = (level = "") => {
  const match = String(level).match(/^ruda-(.+)$/);
  return match?.[1] || "";
};

export const getRudaPhaseLabel = (props = {}, phaseId = "") => {
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

export const prepareRudaGeojsonForDisplay = (level, geojson) => {
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

export const normalizeRoadLayerName = (value) => String(value ?? "").trim();

export const emptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

export const mergeFeatureCollections = (collections) => ({
  type: "FeatureCollection",
  features: collections.flatMap((collection) =>
    Array.isArray(collection?.features) ? collection.features : [],
  ),
});

export function ringArea(coords) {
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

export function computeArea(feature) {
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

export const BASEMAP_STYLES = {
  Satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  Streets: "mapbox://styles/mapbox/streets-v12",
  Light: "mapbox://styles/mapbox/light-v11",
  Dark: "mapbox://styles/mapbox/dark-v11",
  Outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

export class BasemapControl {
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

export const getKhasraNumber = (props = {}) => {
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

export const getMurabbaNumber = (props = {}) => {
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

export const getLayerVisible = (layers = {}, key, fallback = true) => {
  const value = layers?.[key];
  if (typeof value === "object") return value.visible !== false;
  if (typeof value === "boolean") return value;
  return fallback;
};

export const getLayerOpacity = (layers = {}, key, fallback = 100) => {
  const value = layers?.[key];
  if (typeof value === "object" && Number.isFinite(Number(value.opacity))) {
    return Number(value.opacity);
  }
  return fallback;
};

export const getLayerForceLoad = (layers = {}, key) => {
  const value = layers?.[key];
  return typeof value === "object" ? !!value.forceLoad : false;
};

export const boundaryLevelToLayerKey = (level) => {
  if (level === "district") return "districtBoundary";
  if (level === "tehsil") return "tehsilBoundary";
  if (level === "mauza") return "mauzaBoundary";
  if (level === SQUARE_LEVEL) return "squareLayer";
  if (level === ACRE_LEVEL) return "acreLayer";
  if (level?.startsWith?.("proposed-road")) return "proposedRoads";
  if (level?.startsWith?.("ruda")) return "rudaBoundary";
  return null;
};

export const normalizeComparableValue = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const text = String(value).trim().toLowerCase();
  if (!text) return "";

  const numericValue = Number(text);
  if (Number.isFinite(numericValue)) return String(numericValue);

  return text;
};

export const getSelectedMauzaId = (selectedMauza) => {
  if (!selectedMauza) return "";

  if (typeof selectedMauza === "object") {
    return (
      selectedMauza.mauza_id ??
      selectedMauza.moza_id ??
      selectedMauza.mouza_id ??
      selectedMauza.id ??
      selectedMauza.gid ??
      ""
    );
  }

  return selectedMauza;
};

export const getFeatureMauzaValues = (feature = {}) => {
  const props = feature.properties || feature || {};

  return [
    props.mauza_id,
    props.MAUZA_ID,
    props.moza_id,
    props.mouza_id,
    props.mauza_gid,
    props.mauza,
    props.Mauza,
    props.moza,
    props.Moza,
    props.mouza,
    props.Mouza,
  ]
    .map(normalizeComparableValue)
    .filter(Boolean);
};

export const featureMatchesSelectedMauza = (feature, selectedMauza) => {
  const selectedValues = [
    getSelectedMauzaId(selectedMauza),
    typeof selectedMauza === "object" ? selectedMauza?.mauza : selectedMauza,
    typeof selectedMauza === "object" ? selectedMauza?.name : "",
  ]
    .map(normalizeComparableValue)
    .filter(Boolean);

  if (!selectedValues.length) return false;

  const selectedSet = new Set(selectedValues);
  return getFeatureMauzaValues(feature).some((value) => selectedSet.has(value));
};

export const explodePointGeoJSON = (pointGeojson) => ({
  type: "FeatureCollection",
  features: (pointGeojson?.features || []).flatMap((feature, featureIndex) => {
    const geometry = feature?.geometry || {};
    const props = feature?.properties || {};

    if (geometry.type === "Point") {
      return [feature];
    }

    if (geometry.type === "MultiPoint" && Array.isArray(geometry.coordinates)) {
      return geometry.coordinates
        .filter(
          (coordinate) =>
            Array.isArray(coordinate) &&
            coordinate.length >= 2 &&
            Number.isFinite(Number(coordinate[0])) &&
            Number.isFinite(Number(coordinate[1])),
        )
        .map((coordinate, pointIndex) => ({
          type: "Feature",
          id: `${feature?.id ?? props.gid ?? featureIndex}-${pointIndex}`,
          geometry: {
            type: "Point",
            coordinates: [Number(coordinate[0]), Number(coordinate[1])],
          },
          properties: {
            ...props,
            _pointIndex: pointIndex,
          },
        }));
    }

    return [];
  }),
});

export const pointBelongsToMauza = (feature, selectedMauza) => {
  if (!feature || !selectedMauza) return false;

  const props = feature.properties || {};

  if (featureMatchesSelectedMauza(feature, selectedMauza)) return true;

  const mauzaName = normalizeComparableValue(
    selectedMauza?.mauza || selectedMauza?.name || selectedMauza || "",
  );
  const mauzaIdText = normalizeComparableValue(
    getSelectedMauzaId(selectedMauza),
  );

  const names = [props.m1, props.m2, props.m3]
    .map(normalizeComparableValue)
    .filter(Boolean);

  const ids = [props.m1_id, props.m2_id, props.m3_id]
    .map(normalizeComparableValue)
    .filter(Boolean);

  return (
    (!!mauzaName && names.includes(mauzaName)) ||
    (!!mauzaIdText && ids.includes(mauzaIdText))
  );
};

export const filterPointGeoJSONByArea = (pointGeojson, areaGeojson) => {
  const points = explodePointGeoJSON(pointGeojson).features;
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

export const mapboxPointTypeExpression = [
  "upcase",
  ["to-string", ["coalesce", ["get", "type"], ["get", "TYPE"], ""]],
];

export const TRI_JUNCTION_TJ_FILTER = ["==", mapboxPointTypeExpression, "TJ"];
export const TRI_JUNCTION_BURJI_FILTER = ["!=", mapboxPointTypeExpression, "TJ"];

export const isValidLngLatCoordinate = (coordinate) => {
  if (!Array.isArray(coordinate) || coordinate.length < 2) return false;

  const lng = Number(coordinate[0]);
  const lat = Number(coordinate[1]);

  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};

export const isValidPointFeatureForMap = (feature = {}) =>
  feature?.geometry?.type === "Point" &&
  isValidLngLatCoordinate(feature.geometry.coordinates);

export const keepValidPointFeaturesForMap = (pointGeojson) => {
  const explodedFeatures = explodePointGeoJSON(pointGeojson).features;

  return {
    type: "FeatureCollection",
    features: explodedFeatures.filter(isValidPointFeatureForMap),
  };
};
