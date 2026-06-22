import mapboxgl from "mapbox-gl";

const SOURCES = {
  boundary: "flyto-project-boundary-source",
  projectBoundary: "flyto-project-boundary-source",
  block: "flyto-block-source",
  masterPlan: "flyto-masterplan-source",
  spotLevel: "flyto-spot-level-source",
  contours: "flyto-contours-source",
  roads: "flyto-roads-source",
  waterSupplyPoints: "flyto-water-supply-points-source",
  waterSupplyLines: "flyto-water-supply-lines-source",
  sewagePoints: "flyto-sewage-points-source",
  cameraLocations: "flyto-camera-locations-source",
  rudaBoundary: "flyto-ruda-boundary-source",
  rudaMauzaBoundary: "flyto-ruda-mauza-boundary-source",
  proposedRoads: "flyto-proposed-roads-source",
  geodeticNetwork: "flyto-geodetic-network-source",
  introBoundary: "flyto-intro-boundary-source",
  introLabel: "flyto-intro-label-source",
  notifiedBoundary: "flyto-notified-boundary-source",
};

const LAYERS = {
  boundaryFill: "flyto-project-boundary-fill",
  boundaryLine: "flyto-project-boundary-line",
  blockFill: "flyto-block-fill",
  blockLine: "flyto-block-line",
  blockLabel: "flyto-block-label",
  masterPlanFill: "flyto-masterplan-fill",
  masterPlanLine: "flyto-masterplan-line",
  masterPlanLabel: "flyto-masterplan-label",
  spotLevelCircle: "flyto-spot-level-circle",
  contoursLine: "flyto-contours-line",
  roadsFill: "flyto-roads-fill",
  roadsLine: "flyto-roads-line",
  waterSupplyPointsCircle: "flyto-water-supply-points-circle",
  waterSupplyPointsLabel: "flyto-water-supply-points-label",
  waterSupplyLinesLine: "flyto-water-supply-lines-line",
  sewagePointsCircle: "flyto-sewage-points-circle",
  sewagePointsLabel: "flyto-sewage-points-label",
  cameraLocationsCircle: "flyto-camera-locations-circle",
  cameraLocationsLabel: "flyto-camera-locations-label",
  rudaBoundaryFill: "flyto-ruda-boundary-fill",
  rudaBoundaryLine: "flyto-ruda-boundary-line",
  rudaBoundaryDashLine: "flyto-ruda-boundary-dash-line",
  rudaBoundaryLabel: "flyto-ruda-boundary-label",
  rudaMauzaBoundaryFill: "flyto-ruda-mauza-boundary-fill",
  rudaMauzaBoundaryLine: "flyto-ruda-mauza-boundary-line",
  rudaMauzaBoundaryLabel: "flyto-ruda-mauza-boundary-label",
  proposedRoadsLine: "flyto-proposed-roads-line",
  geodeticNetworkCircle: "flyto-geodetic-network-circle",
  geodeticNetworkLabel: "flyto-geodetic-network-label",
  contoursLabel: "flyto-contours-label",
  waterSupplyLinesLabel: "flyto-water-supply-lines-label",
  introBoundaryFill: "flyto-intro-boundary-fill",
  introBoundaryLine: "flyto-intro-boundary-line",
  introLabel: "flyto-intro-label",
  // NEW: Hover highlight layer
  masterPlanHover: "flyto-masterplan-hover",
  notifiedBoundaryLine: "flyto-notified-boundary-line",
  
};

const INTRO_STEPS = [
  {
    label: "Pakistan",
    assetPaths: ["/Pakistan.geojson"],
  },
  {
    label: "Punjab",
    assetPaths: ["/Punjab.geojson"],
  },
  {
    label: "RUDA",
    assetPaths: ["/Ruda.geojson"],
  },
];

const INTRO_CLEAR_SOURCES = [
  SOURCES.boundary,
  SOURCES.block,
  SOURCES.masterPlan,
  SOURCES.spotLevel,
  SOURCES.contours,
  SOURCES.roads,
  SOURCES.waterSupplyPoints,
  SOURCES.waterSupplyLines,
  SOURCES.sewagePoints,
  SOURCES.cameraLocations,
  SOURCES.rudaBoundary,
  SOURCES.rudaMauzaBoundary,
  SOURCES.proposedRoads,
  SOURCES.geodeticNetwork,
  SOURCES.notifiedBoundary,
];

const emptyFC = { type: "FeatureCollection", features: [] };

const ROAD_LEGEND_ITEMS = [
  { label: "Primary Roads (300'-Wide)", color: "#c92020", width: 2 },
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

const getRudaFeatureId = (feature = {}) => {
  const props = feature?.properties || {};
  return (
    props.gid ?? feature?.id ?? props.id ?? props.oid ?? props.fid ?? "ruda"
  );
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

const prepareRudaGeoJSONForDisplay = (geojson = emptyFC) => ({
  type: "FeatureCollection",
  features: (geojson?.features || []).map((feature) => {
    const props = feature?.properties || {};
    const phaseId = getRudaFeatureId(feature);

    return {
      ...feature,
      properties: {
        ...props,
        _ruda_phase_id: phaseId,
        _ruda_phase_color: getRudaPhaseColor(phaseId),
        _ruda_phase_label: getRudaPhaseLabel(props, phaseId),
      },
    };
  }),
});

const normalizeRoadLayerName = (value) => String(value ?? "").trim();

const prepareProposedRoadsGeoJSONForDisplay = (geojson = emptyFC) => ({
  type: "FeatureCollection",
  features: (geojson?.features || []).map((feature) => ({
    ...feature,
    properties: {
      ...(feature?.properties || {}),
      layer: normalizeRoadLayerName(feature?.properties?.layer),
    },
  })),
});

function fitGeoJSON(map, geojson) {
  if (!geojson?.features?.length) return;

  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addCoord = (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) bounds.extend(coord);
    };

    if (geom.type === "Point") addCoord(geom.coordinates);
    if (geom.type === "MultiPoint") geom.coordinates.forEach(addCoord);
    if (geom.type === "LineString") geom.coordinates.forEach(addCoord);
    if (geom.type === "MultiLineString")
      geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "Polygon") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "MultiPolygon")
      geom.coordinates.flat(2).forEach(addCoord);
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 80,
      duration: 900,
      maxZoom: 17,
    });
  }
}

function normalizeGeometryCollections(data) {
  if (!data?.features?.length) return data || emptyFC;

  return {
    ...data,
    features: data.features.map((feature) => {
      if (feature.geometry?.type !== "GeometryCollection") return feature;

      const geometry = feature.geometry.geometries?.find((geom) =>
        [
          "Point",
          "MultiPoint",
          "LineString",
          "MultiLineString",
          "Polygon",
          "MultiPolygon",
        ].includes(geom.type),
      );

      return geometry ? { ...feature, geometry } : feature;
    }),
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitForMapMove(map, fallbackMs = 1200) {
  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    map.once("moveend", finish);
    window.setTimeout(finish, fallbackMs);
  });
}

function getGeoJSONCenter(geojson) {
  if (!geojson?.features?.length) return [69.3451, 30.3753];

  const bounds = new mapboxgl.LngLatBounds();

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addCoord = (coord) => {
      if (Array.isArray(coord) && coord.length >= 2) bounds.extend(coord);
    };

    if (geom.type === "Point") addCoord(geom.coordinates);
    if (geom.type === "MultiPoint") geom.coordinates.forEach(addCoord);
    if (geom.type === "LineString") geom.coordinates.forEach(addCoord);
    if (geom.type === "MultiLineString")
      geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "Polygon") geom.coordinates.flat(1).forEach(addCoord);
    if (geom.type === "MultiPolygon")
      geom.coordinates.flat(2).forEach(addCoord);
  });

  if (bounds.isEmpty()) return [69.3451, 30.3753];

  const center = bounds.getCenter();
  return [center.lng, center.lat];
}

function makeLabelGeoJSON(label, geojson) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { label },
        geometry: {
          type: "Point",
          coordinates: getGeoJSONCenter(geojson),
        },
      },
    ],
  };
}


const RUDA_MAUZA_ASSET_PATHS = ["/RUDA_Mauza.geojson", "/RUDA_Mauza.geosjon"];

async function loadAssetGeoJSON(paths = []) {
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastError = null;

  for (const path of candidates) {
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data?.features?.length) {
        throw new Error("GeoJSON has no features");
      }

      return data;
    } catch (err) {
      lastError = err;
      console.warn(`Intro GeoJSON failed from ${path}:`, err);
    }
  }

  throw lastError || new Error("Intro GeoJSON could not be loaded");
}

function ensureSource(map, sourceId, data = emptyFC) {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(sourceId).setData(data);
  }
}

function setLayerVisibility(map, layerIds, visible) {
  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

function setLayerPaintProperty(map, layerId, property, value) {
  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
}

function applyFlyToLayerOpacities(
  map,
  layerVisibility = {},
  adminBoundaryVisibility = {},
) {
  const getOpacity = (source, key, fallback = 100) =>
    Number(source?.[key] ?? fallback) / 100;

  const boundaryOpacity = getOpacity(layerVisibility, "boundaryOpacity");
  const masterPlanOpacity = getOpacity(layerVisibility, "masterPlanOpacity");
  const spotLevelOpacity = getOpacity(layerVisibility, "spotLevelOpacity");
  const contoursOpacity = getOpacity(layerVisibility, "contoursOpacity");
  const roadsOpacity = getOpacity(layerVisibility, "roadsOpacity");
  const notifiedBoundaryOpacity = getOpacity(
    layerVisibility,
    "notifiedBoundaryOpacity",
  );

  const waterSupplyPointsOpacity = getOpacity(
    layerVisibility,
    "waterSupplyPointsOpacity",
  );
  const waterSupplyLinesOpacity = getOpacity(
    layerVisibility,
    "waterSupplyLinesOpacity",
  );
  const sewagePointsOpacity = getOpacity(
    layerVisibility,
    "sewagePointsOpacity",
  );
  const cameraLocationsOpacity = getOpacity(
    layerVisibility,
    "cameraLocationsOpacity",
  );

  const rudaBoundaryOpacity = getOpacity(
    adminBoundaryVisibility,
    "rudaBoundaryOpacity",
  );
  const rudaMauzaBoundaryOpacity = getOpacity(
    adminBoundaryVisibility,
    "rudaMauzaBoundaryOpacity",
  );
  const geodeticNetworkOpacity = getOpacity(
    adminBoundaryVisibility,
    "geodeticNetworkOpacity",
  );
  const proposedRoadsOpacity = getOpacity(
    adminBoundaryVisibility,
    "proposedRoadsOpacity",
  );

  setLayerPaintProperty(
    map,
    LAYERS.boundaryFill,
    "fill-opacity",
    0.12 * boundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.boundaryLine,
    "line-opacity",
    boundaryOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.notifiedBoundaryLine,
    "line-opacity",
    notifiedBoundaryOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.masterPlanFill,
    "fill-opacity",
    0.45 * masterPlanOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.masterPlanLine,
    "line-opacity",
    masterPlanOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.masterPlanLabel,
    "text-opacity",
    masterPlanOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.spotLevelCircle,
    "circle-opacity",
    spotLevelOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.spotLevelCircle,
    "circle-stroke-opacity",
    spotLevelOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.contoursLine,
    "line-opacity",
    contoursOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.contoursLabel,
    "text-opacity",
    contoursOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.roadsFill,
    "fill-opacity",
    0.35 * roadsOpacity,
  );
  setLayerPaintProperty(map, LAYERS.roadsLine, "line-opacity", roadsOpacity);

  setLayerPaintProperty(
    map,
    LAYERS.waterSupplyPointsCircle,
    "circle-opacity",
    waterSupplyPointsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.waterSupplyPointsCircle,
    "circle-stroke-opacity",
    waterSupplyPointsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.waterSupplyPointsLabel,
    "text-opacity",
    waterSupplyPointsOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.waterSupplyLinesLine,
    "line-opacity",
    waterSupplyLinesOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.waterSupplyLinesLabel,
    "text-opacity",
    waterSupplyLinesOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.sewagePointsCircle,
    "circle-opacity",
    sewagePointsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.sewagePointsCircle,
    "circle-stroke-opacity",
    sewagePointsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.sewagePointsLabel,
    "text-opacity",
    sewagePointsOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.cameraLocationsCircle,
    "circle-opacity",
    cameraLocationsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.cameraLocationsCircle,
    "circle-stroke-opacity",
    cameraLocationsOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.cameraLocationsLabel,
    "text-opacity",
    cameraLocationsOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.rudaBoundaryFill,
    "fill-opacity",
    0.5 * rudaBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.rudaBoundaryLine,
    "line-opacity",
    0.95 * rudaBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.rudaBoundaryDashLine,
    "line-opacity",
    0.9 * rudaBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.rudaBoundaryLabel,
    "text-opacity",
    rudaBoundaryOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.rudaMauzaBoundaryFill,
    "fill-opacity",
    0.12 * rudaMauzaBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.rudaMauzaBoundaryLine,
    "line-opacity",
    rudaMauzaBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.rudaMauzaBoundaryLabel,
    "text-opacity",
    rudaMauzaBoundaryOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.proposedRoadsLine,
    "line-opacity",
    proposedRoadsOpacity,
  );

  setLayerPaintProperty(
    map,
    LAYERS.geodeticNetworkCircle,
    "circle-opacity",
    geodeticNetworkOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.geodeticNetworkCircle,
    "circle-stroke-opacity",
    geodeticNetworkOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.geodeticNetworkLabel,
    "text-opacity",
    geodeticNetworkOpacity,
  );
}

export {
  SOURCES,
  LAYERS,
  INTRO_STEPS,
  INTRO_CLEAR_SOURCES,
  emptyFC,
  ROAD_COLOR_EXPRESSION,
  ROAD_WIDTH_EXPRESSION,
  RUDA_MAUZA_ASSET_PATHS,
  prepareRudaGeoJSONForDisplay,
  prepareProposedRoadsGeoJSONForDisplay,
  fitGeoJSON,
  normalizeGeometryCollections,
  wait,
  waitForMapMove,
  makeLabelGeoJSON,
  ensureSource,
  setLayerVisibility,
  setLayerPaintProperty,
  applyFlyToLayerOpacities,
};
