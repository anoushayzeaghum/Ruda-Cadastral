import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import {
  getAbdulHakeemMotorwayM3GeoJSON,
  getCityLevelServiceGeoJSON,
  getCityLevelServicePointsGeoJSON,
  getExistingForestGeoJSON,
  getForestBoundaryGeoJSON,
  getHardoSohalMuslimRoadGeoJSON,
  getJinnahAvenueRoadGeoJSON,
  getKalaKhataJiInterchangeGeoJSON,
  getKatarBundRoadGeoJSON,
  getLahoreBypassGeoJSON,
  getMpPrincipleZoningGeoJSON,
  getPrecientBoundaryGeoJSON,
  getProposedRoadNetworkGeoJSON,
  getRiverGeoJSON,
  getRiverRaviGeoJSON,
  getRudaJurisdictionGeoJSON,
  getRudaPlanningBoundaryGeoJSON,
  getSialkotMotorwayGeoJSON,
  getTransportationRoadsGeoJSON,
} from "../../../../services/metaverseApi";

const RUDA_MASTER_PLAN_GROUPS = [
  {
    key: "rudaBoundaries",
    label: "RUDA Boundaries",
    children: [
      {
        key: "rudaPlanningBoundary",
        label: "RUDA Planning Boundary",
        color: "#6bb7e8",
      },
      {
        key: "rudaJurisdictionBoundary",
        label: "RUDA Jurisdiction Boundary",
        color: "#f8d56b",
      },
    ],
  },
  {
    key: "proposedRoads",
    label: "Proposed Roads",
    children: [
      {
        key: "rudaProposedRoads",
        label: "RUDA Proposed Roads",
        color: "#19598d",
      },
      {
        key: "transportationRoads",
        label: "Transportation Roads",
        color: "#e11d48",
      },
      {
        key: "lahoreBypass",
        label: "Lahore Bypass",
        color: "#f59e0b",
      },
      {
        key: "jinnahAvenueRoad",
        label: "Jinnah Avenue Road",
        color: "#22c55e",
      },
      {
        key: "hardoSohalMuslimRoad",
        label: "Hardosohal Muslim Road",
        color: "#a855f7",
      },
      {
        key: "katarBundRoad",
        label: "Katar Bund Road",
        color: "#06b6d4",
      },
      {
        key: "kalaKhataJiInterchange",
        label: "Kala Khataj Interchange",
        color: "#f97316",
      },
      {
        key: "sialkotMotorway",
        label: "Sialkot Motorway",
        color: "#14b8a6",
      },
      {
        key: "abdulHakeemMotorwayM3",
        label: "Abdul Hakeem Motorway M-3",
        color: "#ec4899",
      },
    ],
  },
  {
    key: "cityLevelServices",
    label: "City Level Services",
    children: [
      {
        key: "cityLevelServicesPoints",
        label: "City Level Services Points",
        color: "#ef4444",
      },
      {
        key: "cityLevelServicesLayer",
        label: "City Level Services",
        color: "#22c55e",
      },
    ],
  },
  {
    key: "forestBoundaries",
    label: "Forest Boundaries",
    children: [
      {
        key: "forestBoundary",
        label: "Forest Boundary",
        color: "#15803d",
      },
      {
        key: "existingForest",
        label: "Existing Forest",
        color: "#84cc16",
      },
    ],
  },
  {
    key: "precinctBoundary",
    label: "Precinct Boundary",
    children: [
      {
        key: "precinctBoundaryLayer",
        label: "Precinct Boundary",
        color: "#a855f7",
      },
    ],
  },
  {
    key: "riverBoundary",
    label: "River Boundary",
    children: [
      {
        key: "riverBoundaryLayer",
        label: "River Boundary",
        color: "#38bdf8",
      },
      {
        key: "riverRavi",
        label: "River Ravi",
        color: "#0ea5e9",
      },
    ],
  },
  {
    key: "mpPrincipalZoning",
    label: "MP Principal Zoning",
    children: [
      {
        key: "mpPrincipalZoningLayer",
        label: "MP Principal Zoning",
        color: "#f97316",
      },
    ],
  },
];

const RUDA_MASTER_PLAN_LAYER_CONFIG = {
  rudaPlanningBoundary: {
    endpoint: "/ruda-planning-boundary/",
    fetchGeoJSON: getRudaPlanningBoundaryGeoJSON,
  },
  rudaJurisdictionBoundary: {
    endpoint: "/ruda-jurisdiction/",
    fetchGeoJSON: getRudaJurisdictionGeoJSON,
  },
  rudaProposedRoads: {
    endpoint: "/proposed-road-network/",
    fetchGeoJSON: getProposedRoadNetworkGeoJSON,
    lineWidth: 3,
    categorized: true,
  },
  transportationRoads: {
    endpoint: "/transportation-roads/",
    fetchGeoJSON: getTransportationRoadsGeoJSON,
    lineWidth: 3,
  },
  lahoreBypass: {
    endpoint: "/lahore-bypass/",
    fetchGeoJSON: getLahoreBypassGeoJSON,
    lineWidth: 3,
  },
  jinnahAvenueRoad: {
    endpoint: "/jinnah-avenue-road/",
    fetchGeoJSON: getJinnahAvenueRoadGeoJSON,
    lineWidth: 3,
  },
  hardoSohalMuslimRoad: {
    endpoint: "/hardo-sohal-muslim-road/",
    fetchGeoJSON: getHardoSohalMuslimRoadGeoJSON,
    lineWidth: 3,
  },
  katarBundRoad: {
    endpoint: "/katar-bund-road/",
    fetchGeoJSON: getKatarBundRoadGeoJSON,
    lineWidth: 3,
  },
  kalaKhataJiInterchange: {
    endpoint: "/kala-khata-ji-interchange/",
    fetchGeoJSON: getKalaKhataJiInterchangeGeoJSON,
    lineWidth: 3,
  },
  sialkotMotorway: {
    endpoint: "/sialkot-motorway/",
    fetchGeoJSON: getSialkotMotorwayGeoJSON,
    lineWidth: 3,
  },
  abdulHakeemMotorwayM3: {
    endpoint: "/abdul-hakeem-motorway-m3/",
    fetchGeoJSON: getAbdulHakeemMotorwayM3GeoJSON,
    lineWidth: 3,
  },
  cityLevelServicesPoints: {
    endpoint: "/city-level-service-points/",
    fetchGeoJSON: getCityLevelServicePointsGeoJSON,
    circleRadius: 5,
  },
  cityLevelServicesLayer: {
    endpoint: "/city-level-service/",
    fetchGeoJSON: getCityLevelServiceGeoJSON,
    categorizedServices: true,
  },
  forestBoundary: {
    endpoint: "/forest-boundary/",
    fetchGeoJSON: getForestBoundaryGeoJSON,
  },
  existingForest: {
    endpoint: "/existing-forest/",
    fetchGeoJSON: getExistingForestGeoJSON,
    categorizedExistingForest: true,
  },
  precinctBoundaryLayer: {
    endpoint: "/precient-boundary/",
    fetchGeoJSON: getPrecientBoundaryGeoJSON,
  },
  riverBoundaryLayer: {
    endpoint: "/river/",
    fetchGeoJSON: getRiverGeoJSON,
  },
  riverRavi: {
    endpoint: "/river-ravi/",
    fetchGeoJSON: getRiverRaviGeoJSON,
  },
  mpPrincipalZoningLayer: {
    endpoint: "/mp-principle-zoning/",
    fetchGeoJSON: getMpPrincipleZoningGeoJSON,
  },
};

const RUDA_PROPOSED_ROAD_LEGEND = [
  { label: "Ravi Ring Road", color: "#b30000", values: ["ravi ring road"] },
  { label: "Primary Road", color: "#ff1a1a", values: ["primary road"] },
  { label: "Secondary Road", color: "#55aa00", values: ["secondary road"] },
  { label: "Tertiary Road", color: "#f2b705", values: ["tertiary road"] },
  { label: "Bridge", color: "#ff4fc3", values: ["bridge"] },
  {
    label: "Jahangir Tomb Bridge and Flyover",
    color: "#f4cf78",
    values: ["jahangir tomb bridge and flyover", "jahangir tomb bridge"],
  },
  {
    label: "Proposed SL-4",
    color: "#d9a441",
    values: ["proposed sl-4", "proposed sl4"],
  },
  {
    label: "Promenade Road with Service Road",
    color: "#c02ad3",
    values: [
      "promenade road with service road",
      "promenade road with servi",
      "promenade road",
    ],
  },
];

const ROAD_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "type"],
      ["get", "road_type"],
      ["get", "layer"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

const DEFAULT_RUDA_PROPOSED_ROAD_COLORS = RUDA_PROPOSED_ROAD_LEGEND.reduce(
  (colors, item) => {
    colors[item.label] = item.color;
    return colors;
  },
  {},
);

const CITY_LEVEL_SERVICES_LEGEND = [
  {
    label: "Command and Control Center",
    color: "#6f1d9b",
    values: ["command and control center", "command & control center"],
  },
  {
    label: "Farmer Market",
    color: "#f4d40a",
    values: ["farmer market", "farmers market"],
  },
  {
    label: "Freight Terminal",
    color: "#8b3a2b",
    values: ["freight terminal"],
  },
  {
    label: "Govt. Office",
    color: "#ffb3b3",
    values: ["govt. office", "govt office", "government office"],
  },
  {
    label: "Graveyard",
    color: "#d7f000",
    values: ["graveyard"],
  },
  {
    label: "Grid Station",
    color: "#e35ab7",
    values: ["grid station"],
  },
  {
    label: "Hospital",
    color: "#ff1f3d",
    values: ["hospital"],
  },
  {
    label: "Judicial Complex",
    color: "#37b34a",
    values: ["judicial complex"],
  },
  {
    label: "Landfill Site",
    color: "#cf3b20",
    values: ["landfill site", "land fill site"],
  },
  {
    label: "Multi Model Bus Terminal",
    color: "#ff1b2d",
    values: [
      "multi model bus terminal",
      "multi modal bus terminal",
      "multimodal bus terminal",
    ],
  },
  {
    label: "Park",
    color: "#45c83f",
    values: ["park"],
  },
  {
    label: "Social Housing",
    color: "#8dbb3f",
    values: ["social housing"],
  },
  {
    label: "Sports Complex",
    color: "#d9ea12",
    values: ["sports complex"],
  },
  {
    label: "Transport Services",
    color: "#d93bc0",
    values: ["transport services", "transport service"],
  },
  {
    label: "University",
    color: "#ff6a00",
    values: ["university"],
  },
];

const CITY_LEVEL_SERVICE_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "service_type"],
      ["get", "service"],
      ["get", "type"],
      ["get", "land_use"],
      ["get", "landuse"],
      ["get", "category"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

const DEFAULT_CITY_LEVEL_SERVICE_COLORS = CITY_LEVEL_SERVICES_LEGEND.reduce(
  (colors, item) => {
    colors[item.label] = item.color;
    return colors;
  },
  {},
);

const buildCityLevelServiceColorExpression = (
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
) => [
  "match",
  CITY_LEVEL_SERVICE_TYPE_EXPRESSION,
  ...CITY_LEVEL_SERVICES_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      serviceColors[item.label] || item.color,
    ]),
  ),
  "#22c55e",
];

const EXISTING_FOREST_LEGEND = [
  {
    label: "Brick Kiln",
    color: "#f2ef72",
    values: ["brick kiln"],
  },
  {
    label: "Brick Kiln Service Area",
    color: "#fff2a6",
    values: ["brick kiln service area"],
  },
  {
    label: "Dumping Site",
    color: "#ffd8bd",
    values: ["dumping site"],
  },
  {
    label: "Education",
    color: "#d7d7bd",
    values: ["education"],
  },
  {
    label: "Forest",
    color: "#a6c86a",
    values: ["forest"],
  },
  {
    label: "Graveyard",
    color: "#d9f238",
    values: ["graveyard"],
  },
  {
    label: "Industrial",
    color: "#ff4fcb",
    values: ["industrial"],
  },
  {
    label: "Open Land/New Development",
    color: "#ffd98b",
    values: [
      "open land/new development",
      "open land / new development",
      "open land",
      "new development",
    ],
  },
  {
    label: "Planned Housing",
    color: "#e5b970",
    values: ["planned housing"],
  },
  {
    label: "Public Building",
    color: "#d9c487",
    values: ["public building"],
  },
  {
    label: "Restricted Area",
    color: "#b8b8b8",
    values: ["restricted area"],
  },
  {
    label: "UnPlanned Settlement",
    color: "#ffb69b",
    values: [
      "unplanned settlement",
      "un planned settlement",
      "unplanned settlements",
    ],
  },
];

const EXISTING_FOREST_TYPE_EXPRESSION = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "land_use"],
      ["get", "landuse"],
      ["get", "class"],
      ["get", "classification"],
      ["get", "category"],
      ["get", "type"],
      ["get", "name"],
      ["get", "refname"],
      "other",
    ],
  ],
];

const DEFAULT_EXISTING_FOREST_COLORS = EXISTING_FOREST_LEGEND.reduce(
  (colors, item) => {
    colors[item.label] = item.color;
    return colors;
  },
  {},
);

const buildExistingForestColorExpression = (
  forestColors = DEFAULT_EXISTING_FOREST_COLORS,
) => [
  "match",
  EXISTING_FOREST_TYPE_EXPRESSION,
  ...EXISTING_FOREST_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      forestColors[item.label] || item.color,
    ]),
  ),
  "#84cc16",
];

const buildRoadColorExpression = (
  roadColors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
) => [
  "match",
  ROAD_TYPE_EXPRESSION,
  ...RUDA_PROPOSED_ROAD_LEGEND.flatMap((item) =>
    item.values.flatMap((value) => [
      value,
      roadColors[item.label] || item.color,
    ]),
  ),
  "#19598d",
];

const RUDA_MASTER_SOURCE_PREFIX = "metaverse-ruda-master-plan";

const POLYGON_FILTER = [
  "match",
  ["geometry-type"],
  ["Polygon", "MultiPolygon"],
  true,
  false,
];

const LINE_FILTER = [
  "match",
  ["geometry-type"],
  ["LineString", "MultiLineString"],
  true,
  false,
];

const POINT_FILTER = [
  "match",
  ["geometry-type"],
  ["Point", "MultiPoint"],
  true,
  false,
];

const getLayerIds = (layerKey) => {
  const base = `${RUDA_MASTER_SOURCE_PREFIX}-${layerKey}`;

  return {
    sourceId: `${base}-source`,
    fillId: `${base}-fill`,
    outlineId: `${base}-outline`,
    lineId: `${base}-line`,
    circleId: `${base}-circle`,
  };
};

const getOpacityRatio = (opacity = 100) => {
  const value = Number(opacity);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 100) / 100;
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const setLayoutVisibility = (map, layerId, visible) => {
  if (map?.getLayer?.(layerId)) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }
};

const normalizeGeoJSON = (geojson) => {
  if (geojson?.type === "FeatureCollection") return geojson;
  if (geojson?.features)
    return { type: "FeatureCollection", features: geojson.features };
  if (Array.isArray(geojson))
    return { type: "FeatureCollection", features: geojson };
  return { type: "FeatureCollection", features: [] };
};

const applyRudaLayerPaint = (
  map,
  layerKey,
  color,
  opacity,
  config = {},
  roadColors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  forestColors = DEFAULT_EXISTING_FOREST_COLORS,
) => {
  if (!map) return;

  const o = getOpacityRatio(opacity);
  const ids = getLayerIds(layerKey);

  setPaint(
    map,
    ids.fillId,
    "fill-color",
    config.categorizedServices
      ? buildCityLevelServiceColorExpression(serviceColors)
      : config.categorizedExistingForest
        ? buildExistingForestColorExpression(forestColors)
        : color,
  );
  setPaint(map, ids.fillId, "fill-opacity", 0.35 * o);

  setPaint(
    map,
    ids.outlineId,
    "line-color",
    config.categorizedServices
      ? buildCityLevelServiceColorExpression(serviceColors)
      : config.categorizedExistingForest
        ? buildExistingForestColorExpression(forestColors)
        : color,
  );
  setPaint(map, ids.outlineId, "line-opacity", 0.95 * o);

  setPaint(
    map,
    ids.lineId,
    "line-color",
    config.categorized
      ? buildRoadColorExpression(roadColors)
      : config.categorizedServices
        ? buildCityLevelServiceColorExpression(serviceColors)
        : config.categorizedExistingForest
          ? buildExistingForestColorExpression(forestColors)
          : color,
  );
  setPaint(map, ids.lineId, "line-opacity", o);
  setPaint(map, ids.lineId, "line-width", config.lineWidth || 1.8);

  setPaint(
    map,
    ids.circleId,
    "circle-color",
    config.categorizedServices
      ? buildCityLevelServiceColorExpression(serviceColors)
      : config.categorizedExistingForest
        ? buildExistingForestColorExpression(forestColors)
        : color,
  );
  setPaint(map, ids.circleId, "circle-opacity", o);
  setPaint(map, ids.circleId, "circle-stroke-opacity", o);
};

const setRudaLayerVisibility = (map, layerKey, visible) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);

  [ids.fillId, ids.outlineId, ids.lineId, ids.circleId].forEach((layerId) => {
    setLayoutVisibility(map, layerId, visible);
  });
};

const addOrUpdateRudaMapLayer = ({
  map,
  layerKey,
  geojson,
  color,
  opacity,
  config = {},
  roadColors = DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  forestColors = DEFAULT_EXISTING_FOREST_COLORS,
}) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);
  const data = normalizeGeoJSON(geojson);
  const visibility = "visible";

  if (!map.getSource(ids.sourceId)) {
    map.addSource(ids.sourceId, {
      type: "geojson",
      data,
    });
  } else {
    map.getSource(ids.sourceId)?.setData?.(data);
  }

  if (!map.getLayer(ids.fillId)) {
    map.addLayer({
      id: ids.fillId,
      type: "fill",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      layout: { visibility },
      paint: {
        "fill-color": config.categorizedServices
          ? buildCityLevelServiceColorExpression(serviceColors)
          : config.categorizedExistingForest
            ? buildExistingForestColorExpression(forestColors)
            : color,
        "fill-opacity": 0.35 * getOpacityRatio(opacity),
      },
    });
  }

  if (!map.getLayer(ids.outlineId)) {
    map.addLayer({
      id: ids.outlineId,
      type: "line",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      layout: { visibility },
      paint: {
        "line-color": config.categorizedServices
          ? buildCityLevelServiceColorExpression(serviceColors)
          : config.categorizedExistingForest
            ? buildExistingForestColorExpression(forestColors)
            : color,
        "line-width": 1.2,
        "line-opacity": 0.95 * getOpacityRatio(opacity),
      },
    });
  }

  if (!map.getLayer(ids.lineId)) {
    map.addLayer({
      id: ids.lineId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: { visibility },
      paint: {
        "line-color": config.categorized
          ? buildRoadColorExpression(roadColors)
          : config.categorizedServices
            ? buildCityLevelServiceColorExpression(serviceColors)
            : config.categorizedExistingForest
              ? buildExistingForestColorExpression(forestColors)
              : color,
        "line-width": config.lineWidth || 1.8,
        "line-opacity": getOpacityRatio(opacity),
      },
    });
  }

  if (!map.getLayer(ids.circleId)) {
    map.addLayer({
      id: ids.circleId,
      type: "circle",
      source: ids.sourceId,
      filter: POINT_FILTER,
      layout: { visibility },
      paint: {
        "circle-radius": config.circleRadius || 4.5,
        "circle-color": config.categorizedServices
          ? buildCityLevelServiceColorExpression(serviceColors)
          : config.categorizedExistingForest
            ? buildExistingForestColorExpression(forestColors)
            : color,
        "circle-opacity": getOpacityRatio(opacity),
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
        "circle-stroke-opacity": getOpacityRatio(opacity),
      },
    });
  }

  applyRudaLayerPaint(
    map,
    layerKey,
    color,
    opacity,
    config,
    roadColors,
    serviceColors,
    forestColors,
  );
  setRudaLayerVisibility(map, layerKey, true);
};

const removeRudaMapLayer = (map, layerKey) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);

  [ids.circleId, ids.lineId, ids.outlineId, ids.fillId].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  if (map.getSource(ids.sourceId)) {
    map.removeSource(ids.sourceId);
  }
};

const createInitialLayerState = () => {
  const initialState = {};

  RUDA_MASTER_PLAN_GROUPS.forEach((group) => {
    group.children.forEach((layer) => {
      initialState[layer.key] = {
        checked: false,
        color: layer.color,
        opacity: 100,
        dropdownOpen: false,
      };
    });
  });

  return initialState;
};

const createInitialDropdownState = () =>
  RUDA_MASTER_PLAN_GROUPS.reduce((state, group) => {
    state[group.key] = false;
    return state;
  }, {});

const extendBounds = (bounds, coords) => {
  if (!Array.isArray(coords)) return;

  if (
    coords.length >= 2 &&
    typeof coords[0] === "number" &&
    typeof coords[1] === "number"
  ) {
    bounds.extend(coords);
    return;
  }

  coords.forEach((coord) => extendBounds(bounds, coord));
};

const getFeatureCount = (geojson) => normalizeGeoJSON(geojson).features.length;

export default function RUDAMasterPlan({ map }) {
  const [open, setOpen] = useState(false);
  const [groupDropdowns, setGroupDropdowns] = useState(
    createInitialDropdownState,
  );
  const [layerState, setLayerState] = useState(createInitialLayerState);
  const [activeAttributeLayer, setActiveAttributeLayer] = useState(null);
  const [layerMeta, setLayerMeta] = useState({});
  const [proposedRoadColors, setProposedRoadColors] = useState(
    DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  );
  const [cityLevelServiceColors, setCityLevelServiceColors] = useState(
    DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  );
  const [existingForestColors, setExistingForestColors] = useState(
    DEFAULT_EXISTING_FOREST_COLORS,
  );

  const loadedGeoJSONRef = useRef({});
  const requestTokenRef = useRef({});
  const layerStateRef = useRef(layerState);
  const zoomOnLoadRef = useRef({});
  const proposedRoadColorsRef = useRef(proposedRoadColors);
  const cityLevelServiceColorsRef = useRef(cityLevelServiceColors);
  const existingForestColorsRef = useRef(existingForestColors);

  useEffect(() => {
    layerStateRef.current = layerState;
  }, [layerState]);

  useEffect(() => {
    proposedRoadColorsRef.current = proposedRoadColors;
  }, [proposedRoadColors]);

  useEffect(() => {
    cityLevelServiceColorsRef.current = cityLevelServiceColors;
  }, [cityLevelServiceColors]);

  useEffect(() => {
    existingForestColorsRef.current = existingForestColors;
  }, [existingForestColors]);

  const layerLookup = useMemo(() => {
    const lookup = {};

    RUDA_MASTER_PLAN_GROUPS.forEach((group) => {
      group.children.forEach((layer) => {
        lookup[layer.key] = layer;
      });
    });

    return lookup;
  }, []);

  const runWhenMapReady = (callback) => {
    if (!map) return;

    if (map.isStyleLoaded?.()) {
      callback();
      return;
    }

    const onReady = () => {
      map.off("load", onReady);
      map.off("style.load", onReady);
      callback();
    };

    map.once("load", onReady);
    map.once("style.load", onReady);
  };

  const zoomToGeoJSON = (geojson) => {
    if (!map) return;

    try {
      const data = normalizeGeoJSON(geojson);
      if (!data.features.length) return;

      const bounds = new mapboxgl.LngLatBounds();

      data.features.forEach((feature) => {
        const geometry = feature?.geometry;
        if (!geometry) return;

        if (geometry.type === "GeometryCollection") {
          geometry.geometries?.forEach((geom) => {
            extendBounds(bounds, geom.coordinates);
          });
          return;
        }

        extendBounds(bounds, geometry.coordinates);
      });

      if (bounds.isEmpty()) return;

      map.fitBounds(bounds, {
        padding: 70,
        duration: 1000,
        maxZoom: 14,
      });
    } catch (error) {
      console.error("RUDA Master Plan zoom error:", error);
    }
  };

  const applyVisibleLayer = (layerKey, state, shouldZoom = false) => {
    const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
    const geojson = loadedGeoJSONRef.current[layerKey];

    if (!map || !config || !geojson) return;

    runWhenMapReady(() => {
      addOrUpdateRudaMapLayer({
        map,
        layerKey,
        geojson,
        color: state.color || layerLookup[layerKey]?.color || "#6bb7e8",
        opacity: state.opacity ?? 100,
        config,
        roadColors: proposedRoadColorsRef.current,
        serviceColors: cityLevelServiceColorsRef.current,
        forestColors: existingForestColorsRef.current,
      });

      if (shouldZoom) zoomToGeoJSON(geojson);
    });
  };

  const loadRudaLayer = async (layerKey, state, shouldZoom = false) => {
    const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
    if (!map || !config) return;

    if (loadedGeoJSONRef.current[layerKey]) {
      applyVisibleLayer(layerKey, state, shouldZoom);
      setLayerMeta((prev) => ({
        ...prev,
        [layerKey]: {
          status: "Loaded",
          endpoint: config.endpoint,
          featureCount: getFeatureCount(loadedGeoJSONRef.current[layerKey]),
        },
      }));
      return;
    }

    const token = Date.now();
    requestTokenRef.current[layerKey] = token;

    setLayerMeta((prev) => ({
      ...prev,
      [layerKey]: {
        status: "Loading",
        endpoint: config.endpoint,
        featureCount: 0,
      },
    }));

    try {
      const geojson = normalizeGeoJSON(await config.fetchGeoJSON());

      if (requestTokenRef.current[layerKey] !== token) return;

      loadedGeoJSONRef.current[layerKey] = geojson;

      setLayerMeta((prev) => ({
        ...prev,
        [layerKey]: {
          status: "Loaded",
          endpoint: config.endpoint,
          featureCount: getFeatureCount(geojson),
        },
      }));

      if (layerStateRef.current[layerKey]?.checked) {
        applyVisibleLayer(layerKey, state, shouldZoom);
      }
    } catch (error) {
      console.error(`RUDA Master Plan layer load failed: ${layerKey}`, error);

      setLayerMeta((prev) => ({
        ...prev,
        [layerKey]: {
          status: "Error",
          endpoint: config.endpoint,
          featureCount: 0,
        },
      }));
    }
  };

  useEffect(() => {
    if (!map) return;

    Object.entries(layerState).forEach(([layerKey, state]) => {
      const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
      if (!config) return;

      if (state?.checked) {
        const shouldZoom = !!zoomOnLoadRef.current[layerKey];
        delete zoomOnLoadRef.current[layerKey];
        loadRudaLayer(layerKey, state, shouldZoom);
      } else {
        requestTokenRef.current[layerKey] = null;
        setRudaLayerVisibility(map, layerKey, false);
      }
    });
  }, [map, layerState]);

  useEffect(() => {
    if (!map) return undefined;

    const reapplyVisibleLayers = () => {
      Object.entries(layerStateRef.current).forEach(([layerKey, state]) => {
        if (!state?.checked || !loadedGeoJSONRef.current[layerKey]) return;
        applyVisibleLayer(layerKey, state);
      });
    };

    map.on("style.load", reapplyVisibleLayers);

    return () => {
      map.off("style.load", reapplyVisibleLayers);
    };
  }, [map]);

  useEffect(() => {
    return () => {
      if (!map) return;

      Object.keys(RUDA_MASTER_PLAN_LAYER_CONFIG).forEach((layerKey) => {
        removeRudaMapLayer(map, layerKey);
      });
    };
  }, [map]);

  const getGroupSelection = (group) => {
    const selectedCount = group.children.filter(
      (layer) => layerState[layer.key]?.checked,
    ).length;

    return {
      checked: selectedCount === group.children.length,
      partial: selectedCount > 0 && selectedCount < group.children.length,
    };
  };

  const toggleGroup = (group) => {
    setLayerState((prev) => {
      const allSelected = group.children.every(
        (layer) => prev[layer.key]?.checked,
      );
      const nextChecked = !allSelected;

      return group.children.reduce(
        (nextState, layer) => ({
          ...nextState,
          [layer.key]: {
            ...nextState[layer.key],
            checked: nextChecked,
          },
        }),
        { ...prev },
      );
    });

    setGroupDropdowns((prev) => ({
      ...prev,
      [group.key]: true,
    }));
  };

  const toggleGroupDropdown = (groupKey) => {
    setGroupDropdowns((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleLayer = (layerKey) => {
    const willBeChecked = !layerState[layerKey]?.checked;

    if (willBeChecked) {
      zoomOnLoadRef.current[layerKey] = true;
    }

    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        checked: !prev[layerKey]?.checked,
      },
    }));
  };

  const updateLayerColor = (layerKey, color) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        color,
      },
    }));

    applyRudaLayerPaint(
      map,
      layerKey,
      color,
      layerState[layerKey]?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey],
      proposedRoadColorsRef.current,
      cityLevelServiceColorsRef.current,
      existingForestColorsRef.current,
    );
  };

  const updateLayerOpacity = (layerKey, opacity) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        opacity,
      },
    }));

    applyRudaLayerPaint(
      map,
      layerKey,
      layerState[layerKey]?.color || layerLookup[layerKey]?.color,
      opacity,
      RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey],
      proposedRoadColorsRef.current,
      cityLevelServiceColorsRef.current,
      existingForestColorsRef.current,
    );
  };

  const updateProposedRoadColor = (roadLabel, color) => {
    const nextColors = {
      ...proposedRoadColorsRef.current,
      [roadLabel]: color,
    };

    proposedRoadColorsRef.current = nextColors;
    setProposedRoadColors(nextColors);

    applyRudaLayerPaint(
      map,
      "rudaProposedRoads",
      layerStateRef.current.rudaProposedRoads?.color || "#19598d",
      layerStateRef.current.rudaProposedRoads?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG.rudaProposedRoads,
      nextColors,
      cityLevelServiceColorsRef.current,
      existingForestColorsRef.current,
    );
  };

  const updateCityLevelServiceColor = (serviceLabel, color) => {
    const nextColors = {
      ...cityLevelServiceColorsRef.current,
      [serviceLabel]: color,
    };

    cityLevelServiceColorsRef.current = nextColors;
    setCityLevelServiceColors(nextColors);

    applyRudaLayerPaint(
      map,
      "cityLevelServicesLayer",
      layerStateRef.current.cityLevelServicesLayer?.color || "#22c55e",
      layerStateRef.current.cityLevelServicesLayer?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG.cityLevelServicesLayer,
      proposedRoadColorsRef.current,
      nextColors,
      existingForestColorsRef.current,
    );
  };

  const updateExistingForestColor = (forestLabel, color) => {
    const nextColors = {
      ...existingForestColorsRef.current,
      [forestLabel]: color,
    };

    existingForestColorsRef.current = nextColors;
    setExistingForestColors(nextColors);

    applyRudaLayerPaint(
      map,
      "existingForest",
      layerStateRef.current.existingForest?.color || "#84cc16",
      layerStateRef.current.existingForest?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG.existingForest,
      proposedRoadColorsRef.current,
      cityLevelServiceColorsRef.current,
      nextColors,
    );
  };

  const toggleLayerDropdown = (layerKey) => {
    setLayerState((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        dropdownOpen: !prev[layerKey]?.dropdownOpen,
      },
    }));
  };

  const activeAttributeLabel = activeAttributeLayer
    ? layerLookup[activeAttributeLayer]?.label
    : "";

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>RUDA MASTER PLAN</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {RUDA_MASTER_PLAN_GROUPS.map((group) => {
            const groupSelection = getGroupSelection(group);
            const isGroupOpen = groupDropdowns[group.key];

            return (
              <div key={group.key} className="mt-3 first:mt-1">
                <GroupItem
                  checked={groupSelection.checked}
                  partial={groupSelection.partial}
                  label={group.label}
                  dropdownOpen={isGroupOpen}
                  onChange={() => toggleGroup(group)}
                  onDropdownToggle={() => toggleGroupDropdown(group.key)}
                />

                {isGroupOpen && (
                  <div className=" mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-2 pb-2 pt-1">
                    {group.children.map((layer) => {
                      const currentLayerState = layerState[layer.key] || {};
                      const currentLayerMeta = layerMeta[layer.key] || {};

                      return (
                        <div key={layer.key}>
                          <LayerItem
                            checked={!!currentLayerState.checked}
                            color={currentLayerState.color || layer.color}
                            label={layer.label}
                            opacity={currentLayerState.opacity ?? 100}
                            dropdownOpen={!!currentLayerState.dropdownOpen}
                            categorized={
                              !!RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key]
                                ?.categorized ||
                              !!RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key]
                                ?.categorizedServices ||
                              !!RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key]
                                ?.categorizedExistingForest
                            }
                            categoryLegend={
                              layer.key === "rudaProposedRoads"
                                ? RUDA_PROPOSED_ROAD_LEGEND
                                : layer.key === "cityLevelServicesLayer"
                                  ? CITY_LEVEL_SERVICES_LEGEND
                                  : layer.key === "existingForest"
                                    ? EXISTING_FOREST_LEGEND
                                    : []
                            }
                            categorizedColors={
                              layer.key === "rudaProposedRoads"
                                ? proposedRoadColors
                                : layer.key === "cityLevelServicesLayer"
                                  ? cityLevelServiceColors
                                  : layer.key === "existingForest"
                                    ? existingForestColors
                                    : {}
                            }
                            onChange={() => toggleLayer(layer.key)}
                            onColorChange={(value) =>
                              updateLayerColor(layer.key, value)
                            }
                            onOpacityChange={(value) =>
                              updateLayerOpacity(layer.key, value)
                            }
                            onDropdownToggle={() =>
                              toggleLayerDropdown(layer.key)
                            }
                          />

                          {currentLayerState.dropdownOpen && (
                            <div
                              className={`ml-6 mt-2 max-h-64 rounded-sm border border-[#13593f]/30 bg-[#06291f] px-3 py-2 text-[11px] text-white/70 ${LAYER_PANEL_SCROLL}`}
                            >
                              {layer.key === "rudaProposedRoads" && (
                                <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
                                  <div className="mb-1.5 font-semibold text-white/90">
                                    Road Classification
                                  </div>
                                  <div className="space-y-1.5">
                                    {RUDA_PROPOSED_ROAD_LEGEND.map((item) => {
                                      const currentColor =
                                        proposedRoadColors[item.label] ||
                                        item.color;

                                      return (
                                        <div
                                          key={item.label}
                                          className="flex items-center gap-2"
                                        >
                                          <label
                                            className="relative h-4 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/40"
                                            style={{
                                              backgroundColor: currentColor,
                                            }}
                                            title={`Change ${item.label} color`}
                                          >
                                            <input
                                              type="color"
                                              value={currentColor}
                                              aria-label={`Change ${item.label} color`}
                                              onChange={(event) =>
                                                updateProposedRoadColor(
                                                  item.label,
                                                  event.target.value,
                                                )
                                              }
                                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                          </label>
                                          <span className="leading-tight">
                                            {item.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {layer.key === "cityLevelServicesLayer" && (
                                <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
                                  <div className="mb-1.5 font-semibold text-white/90">
                                    City Level Services Classification
                                  </div>
                                  <div className="space-y-1.5">
                                    {CITY_LEVEL_SERVICES_LEGEND.map((item) => {
                                      const currentColor =
                                        cityLevelServiceColors[item.label] ||
                                        item.color;

                                      return (
                                        <div
                                          key={item.label}
                                          className="flex items-center gap-2"
                                        >
                                          <label
                                            className="relative h-4 w-4 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/40"
                                            style={{
                                              backgroundColor: currentColor,
                                            }}
                                            title={`Change ${item.label} color`}
                                          >
                                            <input
                                              type="color"
                                              value={currentColor}
                                              aria-label={`Change ${item.label} color`}
                                              onChange={(event) =>
                                                updateCityLevelServiceColor(
                                                  item.label,
                                                  event.target.value,
                                                )
                                              }
                                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                          </label>
                                          <span className="leading-tight">
                                            {item.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {layer.key === "existingForest" && (
                                <div className="mb-2 border-b border-[#343c4c]/70 pb-2">
                                  <div className="mb-1.5 font-semibold text-white/90">
                                    Existing Forest Classification
                                  </div>
                                  <div className="space-y-1.5">
                                    {EXISTING_FOREST_LEGEND.map((item) => {
                                      const currentColor =
                                        existingForestColors[item.label] ||
                                        item.color;

                                      return (
                                        <div
                                          key={item.label}
                                          className="flex items-center gap-2"
                                        >
                                          <label
                                            className="relative h-4 w-4 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/40"
                                            style={{
                                              backgroundColor: currentColor,
                                            }}
                                            title={`Change ${item.label} color`}
                                          >
                                            <input
                                              type="color"
                                              value={currentColor}
                                              aria-label={`Change ${item.label} color`}
                                              onChange={(event) =>
                                                updateExistingForestColor(
                                                  item.label,
                                                  event.target.value,
                                                )
                                              }
                                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                          </label>
                                          <span className="leading-tight">
                                            {item.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                                <span>Status</span>
                                <span>
                                  {currentLayerMeta.status || "Not loaded"}
                                </span>
                              </div>
                              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                                <span>Features</span>
                                <span>
                                  {currentLayerMeta.featureCount ?? 0}
                                </span>
                              </div>
                              <div className="flex justify-between gap-3 py-1">
                                <span>Data source</span>
                                <span className="truncate text-right">
                                  {currentLayerMeta.endpoint || "Not connected"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeAttributeLayer && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {activeAttributeLabel} attribute table will be connected later.
            </span>
            <button
              type="button"
              onClick={() => setActiveAttributeLayer(null)}
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupItem({
  checked,
  partial,
  label,
  dropdownOpen,
  onChange,
  onDropdownToggle,
}) {
  return (
    <div className="flex items-center justify-between rounded-sm px-1 py-1 hover:bg-[#0f3d2e]/40">
      <label className="flex min-w-0 cursor-pointer items-center gap-2">
        <IndeterminateCheckbox
          checked={checked}
          partial={partial}
          onChange={onChange}
        />
        <span className="truncate text-[11px] text-white/90">{label}</span>
      </label>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDropdownToggle?.();
        }}
        className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
        title={`Show ${label} layers`}
      >
        {dropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}

function IndeterminateCheckbox({ checked, partial, onChange }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = partial;
    }
  }, [partial]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="accent-[#65c96b]"
    />
  );
}

function LayerItem({
  checked,
  color,
  label,
  opacity,
  dropdownOpen,
  categorized = false,
  categoryLegend = [],
  categorizedColors = {},
  onChange,
  onColorChange,
  onOpacityChange,
  onDropdownToggle,
}) {
  const handleColorEvent = (event) => {
    event.stopPropagation();
  };

  const handleColorChange = (event) => {
    event.stopPropagation();
    onColorChange?.(event.target.value);
  };

  const categorizedGradient = `linear-gradient(90deg, ${categoryLegend
    .map((item, index) => {
      const start = index * (100 / Math.max(categoryLegend.length, 1));
      const end = (index + 1) * (100 / Math.max(categoryLegend.length, 1));
      const itemColor = categorizedColors[item.label] || item.color;
      return `${itemColor} ${start}% ${end}%`;
    })
    .join(", ")})`;

  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex min-w-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          <span
            className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/50"
            style={
              categorized
                ? {
                    background: categorizedGradient,
                    borderColor: "rgba(255,255,255,0.6)",
                  }
                : { backgroundColor: color, borderColor: color }
            }
            title={
              categorized
                ? `${label} classified colors — expand details to edit each color`
                : `Change ${label} color`
            }
            onClick={handleColorEvent}
            onMouseDown={handleColorEvent}
          >
            <input
              type="color"
              value={color}
              disabled={categorized}
              aria-label={
                categorized
                  ? `${label} classified colors`
                  : `Change ${label} color`
              }
              onClick={handleColorEvent}
              onMouseDown={handleColorEvent}
              onInput={handleColorChange}
              onChange={handleColorChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>

          <span className="truncate text-[11px]">{label}</span>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDropdownToggle?.();
            }}
            className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
            title={`Show ${label} details`}
          >
            {dropdownOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}
