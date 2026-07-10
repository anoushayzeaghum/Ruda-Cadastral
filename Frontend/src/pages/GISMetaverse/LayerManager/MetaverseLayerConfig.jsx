import mapboxgl from "mapbox-gl";

const SOURCES = {
  boundary: "metaverse-project-boundary-source",
  block: "metaverse-block-source",
  masterPlan: "metaverse-masterplan-source",
  spotLevel: "metaverse-spot-level-source",
  contours: "metaverse-contours-source",
  roads: "metaverse-roads-source",
  waterSupplyPoints: "metaverse-water-supply-points-source",
  waterSupplyLines: "metaverse-water-supply-lines-source",
  sewagePoints: "metaverse-sewage-points-source",
  cameraLocations: "metaverse-camera-locations-source",
  rudaBoundary: "metaverse-ruda-boundary-source",
  rudaMauzaBoundary: "metaverse-ruda-mauza-boundary-source",
  proposedRoads: "metaverse-proposed-roads-source",
  geodeticNetwork: "metaverse-geodetic-network-source",
  rtwPackage: "metaverse-rtw-package-source",
  rtwAlignment: "metaverse-rtw-alignment-source",
  stateLand: "metaverse-state-land-source",
  awardedLand: "metaverse-awarded-land-source",
  possessionLand: "metaverse-possession-land-source",
  introBoundary: "metaverse-intro-boundary-source",
  introLabel: "metaverse-intro-label-source",
  notifiedBoundary: "metaverse-notified-boundary-source",
};

const LAYERS = {
  boundaryFill: "metaverse-project-boundary-fill",
  boundaryLine: "metaverse-project-boundary-line",
  blockFill: "metaverse-block-fill",
  blockLine: "metaverse-block-line",
  blockLabel: "metaverse-block-label",
  masterPlanFill: "metaverse-masterplan-fill",
  masterPlanLine: "metaverse-masterplan-line",
  masterPlanLabel: "metaverse-masterplan-label",
  spotLevelCircle: "metaverse-spot-level-circle",
  contoursLine: "metaverse-contours-line",
  roadsFill: "metaverse-roads-fill",
  roadsLine: "metaverse-roads-line",
  waterSupplyPointsCircle: "metaverse-water-supply-points-circle",
  waterSupplyPointsLabel: "metaverse-water-supply-points-label",
  waterSupplyLinesLine: "metaverse-water-supply-lines-line",
  sewagePointsCircle: "metaverse-sewage-points-circle",
  sewagePointsLabel: "metaverse-sewage-points-label",
  cameraLocationsCircle: "metaverse-camera-locations-circle",
  cameraLocationsLabel: "metaverse-camera-locations-label",
  rudaBoundaryFill: "metaverse-ruda-boundary-fill",
  rudaBoundaryLine: "metaverse-ruda-boundary-line",
  rudaBoundaryDashLine: "metaverse-ruda-boundary-dash-line",
  rudaBoundaryLabel: "metaverse-ruda-boundary-label",
  rudaMauzaBoundaryFill: "metaverse-ruda-mauza-boundary-fill",
  rudaMauzaBoundaryLine: "metaverse-ruda-mauza-boundary-line",
  rudaMauzaBoundaryLabel: "metaverse-ruda-mauza-boundary-label",
  proposedRoadsLine: "metaverse-proposed-roads-line",
  geodeticNetworkCircle: "metaverse-geodetic-network-circle",
  geodeticNetworkLabel: "metaverse-geodetic-network-label",
  rtwPackageFill: "metaverse-rtw-package-fill",
  rtwPackageLine: "metaverse-rtw-package-line",
  rtwPackageLabel: "metaverse-rtw-package-label",
  rtwAlignmentFill: "metaverse-rtw-alignment-fill",
  rtwAlignmentLine: "metaverse-rtw-alignment-line",
  rtwAlignmentLabel: "metaverse-rtw-alignment-label",
  stateLandFill: "metaverse-state-land-fill",
  stateLandLine: "metaverse-state-land-line",
  stateLandLabel: "metaverse-state-land-label",
  awardedLandFill: "metaverse-awarded-land-fill",
  awardedLandLine: "metaverse-awarded-land-line",
  awardedLandLabel: "metaverse-awarded-land-label",
  possessionLandFill: "metaverse-possession-land-fill",
  possessionLandLine: "metaverse-possession-land-line",
  possessionLandLabel: "metaverse-possession-land-label",
  contoursLabel: "metaverse-contours-label",
  waterSupplyLinesLabel: "metaverse-water-supply-lines-label",
  introBoundaryFill: "metaverse-intro-boundary-fill",
  introBoundaryLine: "metaverse-intro-boundary-line",
  introLabel: "metaverse-intro-label",
  // NEW: Hover highlight layer
  masterPlanHover: "metaverse-masterplan-hover",
  notifiedBoundaryLine: "metaverse-notified-boundary-line",
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
  SOURCES.rtwPackage,
  SOURCES.rtwAlignment,
  SOURCES.stateLand,
  SOURCES.awardedLand,
  SOURCES.possessionLand,
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

function getRuntimeLayerStyle(styleKey = "") {
  if (typeof window === "undefined") return {};
  return window.__metaverseLayerRuntimeStyles?.[styleKey] || {};
}

function getRuntimeOpacity(source, stateKey, styleKey, fallback = 100) {
  const runtimeOpacity = getRuntimeLayerStyle(styleKey).opacity;
  const value = runtimeOpacity ?? source?.[stateKey] ?? fallback;
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return fallback / 100;
  return Math.min(Math.max(numeric, 0), 100) / 100;
}

function applyRuntimeLayerColors(map) {
  const colorEntries = [
    {
      key: "boundary",
      paints: [
        [LAYERS.boundaryFill, "fill-color"],
        [LAYERS.boundaryLine, "line-color"],
      ],
    },
    {
      key: "spotLevel",
      paints: [[LAYERS.spotLevelCircle, "circle-color"]],
    },
    {
      key: "contours",
      paints: [
        [LAYERS.contoursLine, "line-color"],
        [LAYERS.contoursLabel, "text-color"],
      ],
    },
    {
      key: "rudaMauzaBoundary",
      paints: [
        [LAYERS.rudaMauzaBoundaryFill, "fill-color"],
        [LAYERS.rudaMauzaBoundaryFill, "fill-outline-color"],
        [LAYERS.rudaMauzaBoundaryLine, "line-color"],
        [LAYERS.rudaMauzaBoundaryLabel, "text-color"],
      ],
    },
    {
      key: "geodeticNetwork",
      paints: [
        [LAYERS.geodeticNetworkCircle, "circle-color"],
        [LAYERS.geodeticNetworkLabel, "text-color"],
      ],
    },
    {
      key: "rtwPackage",
      paints: [
        [LAYERS.rtwPackageFill, "fill-color"],
        [LAYERS.rtwPackageLine, "line-color"],
        [LAYERS.rtwPackageLabel, "text-color"],
      ],
    },
    {
      key: "rtwAlignment",
      paints: [
        [LAYERS.rtwAlignmentFill, "fill-color"],
        [LAYERS.rtwAlignmentLine, "line-color"],
        [LAYERS.rtwAlignmentLabel, "text-color"],
      ],
    },
    {
      key: "stateLand",
      paints: [
        [LAYERS.stateLandFill, "fill-color"],
        [LAYERS.stateLandLine, "line-color"],
        [LAYERS.stateLandLabel, "text-color"],
      ],
    },
    {
      key: "awardedLand",
      paints: [
        [LAYERS.awardedLandFill, "fill-color"],
        [LAYERS.awardedLandLine, "line-color"],
        [LAYERS.awardedLandLabel, "text-color"],
      ],
    },
    {
      key: "possessionLand",
      paints: [
        [LAYERS.possessionLandFill, "fill-color"],
        [LAYERS.possessionLandLine, "line-color"],
        [LAYERS.possessionLandLabel, "text-color"],
      ],
    },
    {
      key: "waterSupplyPoints",
      paints: [
        [LAYERS.waterSupplyPointsCircle, "circle-color"],
        [LAYERS.waterSupplyPointsLabel, "text-color"],
      ],
    },
    {
      key: "waterSupplyLines",
      paints: [
        [LAYERS.waterSupplyLinesLine, "line-color"],
        [LAYERS.waterSupplyLinesLabel, "text-color"],
      ],
    },
    {
      key: "sewagePoints",
      paints: [
        [LAYERS.sewagePointsCircle, "circle-color"],
        [LAYERS.sewagePointsLabel, "text-color"],
      ],
    },
    {
      key: "cameraLocations",
      paints: [
        [LAYERS.cameraLocationsCircle, "circle-color"],
        [LAYERS.cameraLocationsLabel, "text-color"],
      ],
    },
    {
      key: "notifiedBoundary",
      paints: [[LAYERS.notifiedBoundaryLine, "line-color"]],
    },
  ];

  colorEntries.forEach(({ key, paints }) => {
    const color = getRuntimeLayerStyle(key).color;
    if (!color) return;

    paints.forEach(([layerId, property]) => {
      setLayerPaintProperty(map, layerId, property, color);
    });
  });
}

function applyMetaverseLayerOpacities(
  map,
  layerVisibility = {},
  adminBoundaryVisibility = {},
) {
  const getOpacity = (source, key, fallback = 100) => {
    const numeric = Number(source?.[key] ?? fallback);
    if (!Number.isFinite(numeric)) return fallback / 100;
    return Math.min(Math.max(numeric, 0), 100) / 100;
  };

  const boundaryOpacity = getRuntimeOpacity(
    layerVisibility,
    "boundaryOpacity",
    "boundary",
  );
  const masterPlanOpacity = getRuntimeOpacity(
    layerVisibility,
    "masterPlanOpacity",
    "masterPlan",
  );
  const blockBoundaryOpacity = getRuntimeOpacity(
    layerVisibility,
    "blockBoundaryOpacity",
    "blockBoundary",
  );
  const spotLevelOpacity = getRuntimeOpacity(layerVisibility, "spotLevelOpacity", "spotLevel");
  const contoursOpacity = getRuntimeOpacity(layerVisibility, "contoursOpacity", "contours");
  const roadsOpacity = getRuntimeOpacity(layerVisibility, "roadsOpacity", "roads");
  const notifiedBoundaryOpacity = getRuntimeOpacity(
    layerVisibility,
    "notifiedBoundaryOpacity",
    "notifiedBoundary",
  );

  const waterSupplyPointsOpacity = getRuntimeOpacity(
    layerVisibility,
    "waterSupplyPointsOpacity",
    "waterSupplyPoints",
  );
  const waterSupplyLinesOpacity = getRuntimeOpacity(
    layerVisibility,
    "waterSupplyLinesOpacity",
    "waterSupplyLines",
  );
  const sewagePointsOpacity = getRuntimeOpacity(
    layerVisibility,
    "sewagePointsOpacity",
    "sewagePoints",
  );
  const cameraLocationsOpacity = getRuntimeOpacity(
    layerVisibility,
    "cameraLocationsOpacity",
    "cameraLocations",
  );

  const rudaBoundaryOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "rudaBoundaryOpacity",
    "rudaBoundary",
  );
  const rudaMauzaBoundaryOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "rudaMauzaBoundaryOpacity",
    "rudaMauzaBoundary",
  );
  const geodeticNetworkOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "geodeticNetworkOpacity",
    "geodeticNetwork",
  );
  const proposedRoadsOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "proposedRoadsOpacity",
    "proposedRoads",
  );

  const rtwPackageOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "rtwPackageOpacity",
    "rtwPackage",
  );
  const rtwAlignmentOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "rtwAlignmentOpacity",
    "rtwAlignment",
  );
  const stateLandOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "stateLandOpacity",
    "stateLand",
  );
  const awardedLandOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "awardedLandOpacity",
    "awardedLand",
  );
  const possessionLandOpacity = getRuntimeOpacity(
    adminBoundaryVisibility,
    "possessionLandOpacity",
    "possessionLand",
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
    LAYERS.blockFill,
    "fill-opacity",
    0.28 * blockBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.blockLine,
    "line-opacity",
    blockBoundaryOpacity,
  );
  setLayerPaintProperty(
    map,
    LAYERS.blockLabel,
    "text-opacity",
    blockBoundaryOpacity,
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

  [
    { fill: LAYERS.rtwPackageFill, line: LAYERS.rtwPackageLine, label: LAYERS.rtwPackageLabel, opacity: rtwPackageOpacity },
    { fill: LAYERS.rtwAlignmentFill, line: LAYERS.rtwAlignmentLine, label: LAYERS.rtwAlignmentLabel, opacity: rtwAlignmentOpacity },
    { fill: LAYERS.stateLandFill, line: LAYERS.stateLandLine, label: LAYERS.stateLandLabel, opacity: stateLandOpacity },
    { fill: LAYERS.awardedLandFill, line: LAYERS.awardedLandLine, label: LAYERS.awardedLandLabel, opacity: awardedLandOpacity },
    { fill: LAYERS.possessionLandFill, line: LAYERS.possessionLandLine, label: LAYERS.possessionLandLabel, opacity: possessionLandOpacity },
  ].forEach(({ fill, line, label, opacity }) => {
    setLayerPaintProperty(map, fill, "fill-opacity", 0.35 * opacity);
    setLayerPaintProperty(map, line, "line-opacity", opacity);
    setLayerPaintProperty(map, label, "text-opacity", opacity);
  });

  applyRuntimeLayerColors(map);
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
  applyMetaverseLayerOpacities,
};
