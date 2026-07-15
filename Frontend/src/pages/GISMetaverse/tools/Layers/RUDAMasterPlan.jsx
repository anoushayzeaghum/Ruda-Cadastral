import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import RudaProposedRoadsLayer, {
  DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  RUDA_PROPOSED_ROAD_LEGEND,
  getRudaProposedRoadLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/RudaProposedRoadsLayer";
import TransportationRoadsLayer, {
  DEFAULT_TRANSPORTATION_ROAD_COLORS,
  TRANSPORTATION_ROADS_LEGEND,
  getTransportationRoadCasingPaint,
  getTransportationRoadLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/TransportationRoadsLayer";
import {
  getOrangeTrackCasingPaint,
  getOrangeTrackLinePaint,
  getOrangeTrackOverlayPaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/OrangeTrackLayer";
import {
  getLahoreRingRoadCasingPaint,
  getLahoreRingRoadLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/LahoreRingRoadLayer";
import {
  getAbdulHakeemMotorwayCasingPaint,
  getAbdulHakeemMotorwayLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/AbdulHakeemMotorwayM3Layer";
import {
  getSialkotMotorwayCasingPaint,
  getSialkotMotorwayLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/SialkotMotorwayLayer";
import {
  getRailwayLineCasingPaint,
  getRailwayLinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RoadBridgesTransportLayers/RailwayLineLayer";
import { getRudaPlanningBoundaryOutlinePaint } from "./LayerManager/RudaMasterPlanLayers/Boundaries/RudaPlanningBoundaryLayer";
import { getRudaJurisdictionBoundaryOutlinePaint } from "./LayerManager/RudaMasterPlanLayers/Boundaries/RudaJurisdictionBoundaryLayer";
import {
  getPrecinctBoundaryLabelLayout,
  getPrecinctBoundaryLabelPaint,
  getPrecinctBoundaryOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/Boundaries/PrecinctBoundaryLayer";
import {
  getAbdulHakeemMotorwayM3GeoJSON,
  getCityLevelServiceGeoJSON,
  getCityLevelServicePointsGeoJSON,
  getExistingForestGeoJSON,
  getForestBoundaryGeoJSON,
  getHardoSohalMuslimRoadGeoJSON,
  getJinnahAvenueGeoJSON,
  getKalaKhataiInterchangeGeoJSON,
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
  getLahoreRingRoadGeoJSON,
  getIrrigationNetworkGeoJSON,
  getExistingDrainsGeoJSON,
  getLinkCanalGeoJSON,
  getBranchCanalGeoJSON,
  getDistributaryGeoJSON,
  getHudiaraDrainGeoJSON,
  getRailwayLineGeoJSON,
  getRailwayStationsGeoJSON,
  getOrangeTrackGeoJSON,
  getLahoreRapidMassTransitGeoJSON,
  getBridgesGeoJSON,
  getGanjaKalanTruckStandGeoJSON,
  getProposedWWTPGeoJSON,
  getWWTPSitesGeoJSON,
  getKatarBandWWTPGeoJSON,
  getSWTPSiteGeoJSON,
  getRudaGeoJSON,
  getRtwPackageGeoJSON,
  getRtwAlignmentGeoJSON,
} from "../../../../services/metaverseApi";

const RUDA_MASTER_PLAN_GROUPS = [
  {
    key: "masterPlanningBoundaryGroup",
    label: "Master Planning Boundary",
    standalone: true,
    children: [
      {
        key: "rudaPlanningBoundary",
        label: "Master Planning Boundary",
        color: "#f4ea00",
      },
    ],
  },
  {
    key: "masterPlanPhasesGroup",
    label: "Master Plan Phases",
    standalone: true,
    children: [
      {
        key: "masterPlanPhases",
        label: "Master Plan Phases",
        color: "#6bb7e8",
      },
    ],
  },
  {
    key: "precinctBoundaryGroup",
    label: "Precinct Boundary",
    standalone: true,
    children: [
      {
        key: "precinctBoundaryLayer",
        label: "Precinct Boundary",
        color: "#f4ea00",
      },
    ],
  },
  {
    key: "cityLevelServicesGroup",
    label: "City Level Services",
    standalone: true,
    children: [
      {
        key: "cityLevelServicesLayer",
        label: "City Level Services",
        color: "#22c55e",
      },
    ],
  },
  {
    key: "cityLevelServicePointsGroup",
    label: "City Level Services Point",
    standalone: true,
    children: [
      {
        key: "cityLevelServicesPoints",
        label: "City Level Services Point",
        color: "#ef4444",
      },
    ],
  },
  {
    key: "riverTrainingWorks",
    label: "River Training Works - RTW",
    children: [
      { key: "rtwPackages", label: "RTW Packages", color: "#8b5cf6" },
      { key: "rtwAlignment", label: "RTW Alignment", color: "#ec4899" },
      { key: "riverBoundaryLayer", label: "River Boundary", color: "#38bdf8" },
      { key: "riverRavi", label: "River Ravi", color: "#0ea5e9" },
    ],
  },
  {
    key: "proposedRoadsGroup",
    label: "Proposed Roads",
    standalone: true,
    children: [
      { key: "rudaProposedRoads", label: "Proposed Roads", color: "#19598d" },
    ],
  },
  {
    key: "wwtp",
    label: "WWTP",
    children: [
      { key: "proposedWWTP", label: "Proposed WWTP", color: "#f97316" },
      { key: "wwtpSite", label: "WWTP Sites", color: "#8b5cf6" },
      { key: "swtpSite", label: "SWTP Sites", color: "#14b8a6" },
    ],
  },
];

const RUDA_MASTER_PLAN_LAYER_CONFIG = {
  masterPlanPhases: {
    endpoint: "/ruda/",
    fetchGeoJSON: getRudaGeoJSON,
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getRudaPlanningBoundaryOutlinePaint,
    getLinePaint: getRudaPlanningBoundaryOutlinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rtwPackages: {
    endpoint: "/rtwpackage/",
    fetchGeoJSON: getRtwPackageGeoJSON,
  },
  rtwAlignment: {
    endpoint: "/rtwalignment/",
    fetchGeoJSON: getRtwAlignmentGeoJSON,
  },
  rudaPlanningBoundary: {
    endpoint: "/ruda-planning-boundary/",
    fetchGeoJSON: getRudaPlanningBoundaryGeoJSON,
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getRudaPlanningBoundaryOutlinePaint,
    getLinePaint: getRudaPlanningBoundaryOutlinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rudaJurisdictionBoundary: {
    endpoint: "/ruda-jurisdiction/",
    fetchGeoJSON: getRudaJurisdictionGeoJSON,
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getRudaJurisdictionBoundaryOutlinePaint,
    getLinePaint: getRudaJurisdictionBoundaryOutlinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rudaProposedRoads: {
    endpoint: "/proposed-road-network/",
    fetchGeoJSON: getProposedRoadNetworkGeoJSON,
    categorized: true,
    categoryLegend: RUDA_PROPOSED_ROAD_LEGEND,
    LegendComponent: RudaProposedRoadsLayer,
    getLinePaint: getRudaProposedRoadLinePaint,
  },
  transportationRoads: {
    endpoint: "/transportation-roads/",
    fetchGeoJSON: getTransportationRoadsGeoJSON,
    categorized: true,
    categoryLegend: TRANSPORTATION_ROADS_LEGEND,
    LegendComponent: TransportationRoadsLayer,
    getLinePaint: getTransportationRoadLinePaint,
    getCasingPaint: getTransportationRoadCasingPaint,
  },
  lahoreRingRoad: {
    endpoint: "/lahore-ring-road/",
    fetchGeoJSON: getLahoreRingRoadGeoJSON,
    paintUsesLayerColor: true,
    getLinePaint: getLahoreRingRoadLinePaint,
    getCasingPaint: getLahoreRingRoadCasingPaint,
  },
  lahoreBypass: {
    endpoint: "/lahore-bypass/",
    fetchGeoJSON: getLahoreBypassGeoJSON,
    lineWidth: 3,
  },
  jinnahAvenue: {
    endpoint: "/jinnah-avenue/",
    fetchGeoJSON: getJinnahAvenueGeoJSON,
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
  kalaKhataiInterchange: {
    endpoint: "/kala-khatai-interchange/",
    fetchGeoJSON: getKalaKhataiInterchangeGeoJSON,
    lineWidth: 3,
  },
  sialkotMotorway: {
    endpoint: "/sialkot-motorway/",
    fetchGeoJSON: getSialkotMotorwayGeoJSON,
    paintUsesLayerColor: true,
    getLinePaint: getSialkotMotorwayLinePaint,
    getCasingPaint: getSialkotMotorwayCasingPaint,
  },
  abdulHakeemMotorwayM3: {
    endpoint: "/abdul-hakeem-motorway-m3/",
    fetchGeoJSON: getAbdulHakeemMotorwayM3GeoJSON,
    paintUsesLayerColor: true,
    getLinePaint: getAbdulHakeemMotorwayLinePaint,
    getCasingPaint: getAbdulHakeemMotorwayCasingPaint,
  },
  irrigationNetwork: {
    endpoint: "/irrigation-network/",
    fetchGeoJSON: getIrrigationNetworkGeoJSON,
    lineWidth: 2.8,
  },
  existingDrains: {
    endpoint: "/existing-drains/",
    fetchGeoJSON: getExistingDrainsGeoJSON,
    lineWidth: 2.8,
  },
  linkCanal: {
    endpoint: "/link-canal/",
    fetchGeoJSON: getLinkCanalGeoJSON,
    lineWidth: 2.8,
  },
  branchCanal: {
    endpoint: "/branch-canal/",
    fetchGeoJSON: getBranchCanalGeoJSON,
    lineWidth: 2.8,
  },
  distributary: {
    endpoint: "/distributary/",
    fetchGeoJSON: getDistributaryGeoJSON,
    lineWidth: 2.8,
  },
  hudiaraDrain: {
    endpoint: "/hudiara-drain/",
    fetchGeoJSON: getHudiaraDrainGeoJSON,
    lineWidth: 2.8,
  },
  railwayLine: {
    endpoint: "/railway-line/",
    fetchGeoJSON: getRailwayLineGeoJSON,
    paintUsesLayerColor: true,
    getLinePaint: getRailwayLinePaint,
    getCasingPaint: getRailwayLineCasingPaint,
    casingLineCap: "butt",
  },
  railwayStations: {
    endpoint: "/railway-stations/",
    fetchGeoJSON: getRailwayStationsGeoJSON,
    circleRadius: 5,
  },
  orangeTrack: {
    endpoint: "/orange-track/",
    fetchGeoJSON: getOrangeTrackGeoJSON,
    paintUsesLayerColor: true,
    getLinePaint: getOrangeTrackLinePaint,
    getCasingPaint: getOrangeTrackCasingPaint,
    getOverlayPaint: getOrangeTrackOverlayPaint,
    overlayLineCap: "butt",
  },
  lahoreRapidMassTransit: {
    endpoint: "/lahore-rapid-mass-transit/",
    fetchGeoJSON: getLahoreRapidMassTransitGeoJSON,
    lineWidth: 3,
  },
  bridges: {
    endpoint: "/bridges/",
    fetchGeoJSON: getBridgesGeoJSON,
    lineWidth: 2.8,
    circleRadius: 5,
  },
  ganjaKalanTruckStand: {
    endpoint: "/ganja-kalan-truck-stand/",
    fetchGeoJSON: getGanjaKalanTruckStandGeoJSON,
  },
  proposedWWTP: {
    endpoint: "/proposed-wwtp/",
    fetchGeoJSON: getProposedWWTPGeoJSON,
  },
  wwtpSite: {
    endpoint: "/wwtp-sites/",
    fetchGeoJSON: getWWTPSitesGeoJSON,
  },
  katarbandWWTP: {
    endpoint: "/katar-band-wwtp/",
    fetchGeoJSON: getKatarBandWWTPGeoJSON,
  },
  swtpSite: {
    endpoint: "/swtp-site/",
    fetchGeoJSON: getSWTPSiteGeoJSON,
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
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getPrecinctBoundaryOutlinePaint,
    getLinePaint: getPrecinctBoundaryOutlinePaint,
    getLabelLayout: getPrecinctBoundaryLabelLayout,
    getLabelPaint: getPrecinctBoundaryLabelPaint,
    labelMinZoom: 10,
    outlineLineCap: "round",
    lineCap: "round",
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

const DEFAULT_CATEGORIZED_ROAD_COLORS = {
  rudaProposedRoads: { ...DEFAULT_RUDA_PROPOSED_ROAD_COLORS },
  transportationRoads: { ...DEFAULT_TRANSPORTATION_ROAD_COLORS },
};

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
    casingId: `${base}-line-casing`,
    lineId: `${base}-line`,
    overlayId: `${base}-line-overlay`,
    circleId: `${base}-circle`,
    labelId: `${base}-label`,
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

const applyPaintObject = (map, layerId, paint = {}) => {
  Object.entries(paint).forEach(([property, value]) => {
    setPaint(map, layerId, property, value);
  });
};

const getRudaLinePaint = ({
  layerKey,
  color,
  opacityRatio,
  config,
  categorizedRoadColors,
  serviceColors,
  forestColors,
}) => {
  if (typeof config.getLinePaint === "function") {
    const styleValue = config.paintUsesLayerColor
      ? color
      : categorizedRoadColors?.[layerKey] || {};

    return config.getLinePaint(styleValue, opacityRatio);
  }

  return {
    "line-color": config.categorizedServices
      ? buildCityLevelServiceColorExpression(serviceColors)
      : config.categorizedExistingForest
        ? buildExistingForestColorExpression(forestColors)
        : color,
    "line-width": config.lineWidth || 1.8,
    "line-opacity": opacityRatio,
  };
};

const getRudaOutlinePaint = ({
  layerKey,
  color,
  opacityRatio,
  config,
  categorizedRoadColors,
  serviceColors,
  forestColors,
}) => {
  if (typeof config.getOutlinePaint === "function") {
    const styleValue = config.paintUsesLayerColor
      ? color
      : categorizedRoadColors?.[layerKey] || {};

    return config.getOutlinePaint(styleValue, opacityRatio);
  }

  return {
    "line-color": config.categorizedServices
      ? buildCityLevelServiceColorExpression(serviceColors)
      : config.categorizedExistingForest
        ? buildExistingForestColorExpression(forestColors)
        : color,
    "line-width": 1.2,
    "line-opacity": 0.95 * opacityRatio,
  };
};

const getRudaCasingPaint = ({
  layerKey,
  color,
  opacityRatio,
  config,
  categorizedRoadColors,
}) => {
  if (typeof config.getCasingPaint !== "function") return null;

  const styleValue = config.paintUsesLayerColor
    ? color
    : categorizedRoadColors?.[layerKey] || {};

  return config.getCasingPaint(styleValue, opacityRatio);
};

const getRudaOverlayPaint = ({
  layerKey,
  color,
  opacityRatio,
  config,
  categorizedRoadColors,
}) => {
  if (typeof config.getOverlayPaint !== "function") return null;

  const styleValue = config.paintUsesLayerColor
    ? color
    : categorizedRoadColors?.[layerKey] || {};

  return config.getOverlayPaint(styleValue, opacityRatio);
};

const applyRudaLayerPaint = (
  map,
  layerKey,
  color,
  opacity,
  config = {},
  categorizedRoadColors = DEFAULT_CATEGORIZED_ROAD_COLORS,
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
  setPaint(
    map,
    ids.fillId,
    "fill-opacity",
    config.hidePolygonFill ? 0 : 0.35 * o,
  );

  applyPaintObject(
    map,
    ids.outlineId,
    getRudaOutlinePaint({
      layerKey,
      color,
      opacityRatio: o,
      config,
      categorizedRoadColors,
      serviceColors,
      forestColors,
    }),
  );

  const casingPaint = getRudaCasingPaint({
    layerKey,
    color,
    opacityRatio: o,
    config,
    categorizedRoadColors,
  });
  if (casingPaint) {
    applyPaintObject(map, ids.casingId, casingPaint);
  }

  applyPaintObject(
    map,
    ids.lineId,
    getRudaLinePaint({
      layerKey,
      color,
      opacityRatio: o,
      config,
      categorizedRoadColors,
      serviceColors,
      forestColors,
    }),
  );

  const overlayPaint = getRudaOverlayPaint({
    layerKey,
    color,
    opacityRatio: o,
    config,
    categorizedRoadColors,
  });
  if (overlayPaint) {
    applyPaintObject(map, ids.overlayId, overlayPaint);
  }

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

  if (typeof config.getLabelPaint === "function") {
    applyPaintObject(map, ids.labelId, config.getLabelPaint(o));
  }
};

const setRudaLayerVisibility = (map, layerKey, visible) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);

  [
    ids.fillId,
    ids.outlineId,
    ids.casingId,
    ids.lineId,
    ids.overlayId,
    ids.circleId,
    ids.labelId,
  ].forEach((layerId) => {
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
  categorizedRoadColors = DEFAULT_CATEGORIZED_ROAD_COLORS,
  serviceColors = DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  forestColors = DEFAULT_EXISTING_FOREST_COLORS,
}) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);
  const data = normalizeGeoJSON(geojson);
  const visibility = "visible";
  const opacityRatio = getOpacityRatio(opacity);

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
        "fill-opacity": config.hidePolygonFill ? 0 : 0.35 * opacityRatio,
      },
    });
  }

  if (!map.getLayer(ids.outlineId)) {
    const outlineLayout =
      typeof config.getOutlinePaint === "function"
        ? {
            visibility,
            "line-cap": config.outlineLineCap || "round",
            "line-join": config.outlineLineJoin || "round",
          }
        : { visibility };

    map.addLayer({
      id: ids.outlineId,
      type: "line",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      layout: outlineLayout,
      paint: getRudaOutlinePaint({
        layerKey,
        color,
        opacityRatio,
        config,
        categorizedRoadColors,
        serviceColors,
        forestColors,
      }),
    });
  }

  const lineLayout =
    typeof config.getLinePaint === "function"
      ? {
          visibility,
          "line-cap": config.lineCap || "round",
          "line-join": config.lineJoin || "round",
        }
      : { visibility };

  const casingLayout = {
    ...lineLayout,
    "line-cap": config.casingLineCap || lineLayout["line-cap"] || "round",
  };

  const overlayLayout = {
    ...lineLayout,
    "line-cap": config.overlayLineCap || lineLayout["line-cap"] || "round",
  };

  const casingPaint = getRudaCasingPaint({
    layerKey,
    color,
    opacityRatio,
    config,
    categorizedRoadColors,
  });

  if (casingPaint && !map.getLayer(ids.casingId)) {
    map.addLayer({
      id: ids.casingId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: casingLayout,
      paint: casingPaint,
    });
  }

  if (!map.getLayer(ids.lineId)) {
    map.addLayer({
      id: ids.lineId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: lineLayout,
      paint: getRudaLinePaint({
        layerKey,
        color,
        opacityRatio,
        config,
        categorizedRoadColors,
        serviceColors,
        forestColors,
      }),
    });
  }

  const overlayPaint = getRudaOverlayPaint({
    layerKey,
    color,
    opacityRatio,
    config,
    categorizedRoadColors,
  });

  if (overlayPaint && !map.getLayer(ids.overlayId)) {
    map.addLayer({
      id: ids.overlayId,
      type: "line",
      source: ids.sourceId,
      filter: LINE_FILTER,
      layout: overlayLayout,
      paint: overlayPaint,
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
        "circle-opacity": opacityRatio,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
        "circle-stroke-opacity": opacityRatio,
      },
    });
  }

  if (
    typeof config.getLabelLayout === "function" &&
    !map.getLayer(ids.labelId)
  ) {
    map.addLayer({
      id: ids.labelId,
      type: "symbol",
      source: ids.sourceId,
      filter: POLYGON_FILTER,
      minzoom: config.labelMinZoom ?? 10,
      layout: {
        visibility,
        ...config.getLabelLayout(),
      },
      paint:
        typeof config.getLabelPaint === "function"
          ? config.getLabelPaint(opacityRatio)
          : {},
    });
  }

  applyRudaLayerPaint(
    map,
    layerKey,
    color,
    opacity,
    config,
    categorizedRoadColors,
    serviceColors,
    forestColors,
  );
  setRudaLayerVisibility(map, layerKey, true);
};

const removeRudaMapLayer = (map, layerKey) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);

  [
    ids.labelId,
    ids.circleId,
    ids.overlayId,
    ids.lineId,
    ids.casingId,
    ids.outlineId,
    ids.fillId,
  ].forEach((layerId) => {
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
  const [categorizedRoadColors, setCategorizedRoadColors] = useState(() => ({
    rudaProposedRoads: { ...DEFAULT_RUDA_PROPOSED_ROAD_COLORS },
    transportationRoads: { ...DEFAULT_TRANSPORTATION_ROAD_COLORS },
  }));
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
  const categorizedRoadColorsRef = useRef(categorizedRoadColors);
  const cityLevelServiceColorsRef = useRef(cityLevelServiceColors);
  const existingForestColorsRef = useRef(existingForestColors);

  useEffect(() => {
    layerStateRef.current = layerState;
  }, [layerState]);

  useEffect(() => {
    categorizedRoadColorsRef.current = categorizedRoadColors;
  }, [categorizedRoadColors]);

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
        categorizedRoadColors: categorizedRoadColorsRef.current,
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
      if (layerKey === "jinnahAvenue") {
        console.log("Jinnah Avenue GeoJSON:", geojson);
        console.log("Features:", geojson.features?.length);
      }

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
      categorizedRoadColorsRef.current,
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
      categorizedRoadColorsRef.current,
      cityLevelServiceColorsRef.current,
      existingForestColorsRef.current,
    );
  };

  const updateCategorizedRoadColor = (layerKey, roadLabel, color) => {
    const nextLayerColors = {
      ...(categorizedRoadColorsRef.current[layerKey] || {}),
      [roadLabel]: color,
    };
    const nextColors = {
      ...categorizedRoadColorsRef.current,
      [layerKey]: nextLayerColors,
    };

    categorizedRoadColorsRef.current = nextColors;
    setCategorizedRoadColors(nextColors);

    applyRudaLayerPaint(
      map,
      layerKey,
      layerStateRef.current[layerKey]?.color ||
        layerLookup[layerKey]?.color ||
        "#19598d",
      layerStateRef.current[layerKey]?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey],
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
      categorizedRoadColorsRef.current,
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
      categorizedRoadColorsRef.current,
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

            if (group.standalone) {
              const layer = group.children[0];
              const currentLayerState = layerState[layer.key] || {};
              const currentLayerMeta = layerMeta[layer.key] || {};
              const currentLayerConfig =
                RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key] || {};

              return (
                <div key={group.key} className="mt-3 first:mt-1">
                  <LayerItem
                    checked={!!currentLayerState.checked}
                    color={currentLayerState.color || layer.color}
                    label={layer.label}
                    opacity={currentLayerState.opacity ?? 100}
                    dropdownOpen={!!currentLayerState.dropdownOpen}
                    categorized={
                      !!currentLayerConfig.categorized ||
                      !!currentLayerConfig.categorizedServices ||
                      !!currentLayerConfig.categorizedExistingForest
                    }
                    categoryLegend={
                      currentLayerConfig.categoryLegend ||
                      (layer.key === "cityLevelServicesLayer"
                        ? CITY_LEVEL_SERVICES_LEGEND
                        : [])
                    }
                    categorizedColors={
                      currentLayerConfig.categorized
                        ? categorizedRoadColors[layer.key] || {}
                        : layer.key === "cityLevelServicesLayer"
                          ? cityLevelServiceColors
                          : {}
                    }
                    onChange={() => toggleLayer(layer.key)}
                    onColorChange={(value) =>
                      updateLayerColor(layer.key, value)
                    }
                    onOpacityChange={(value) =>
                      updateLayerOpacity(layer.key, value)
                    }
                    onDropdownToggle={() => toggleLayerDropdown(layer.key)}
                  />

                  {currentLayerState.dropdownOpen && (
                    <div
                      className={`ml-6 mt-2 max-h-64 rounded-sm border border-[#13593f]/30 bg-[#06291f] px-3 py-2 text-[11px] text-white/70 ${LAYER_PANEL_SCROLL}`}
                    >
                      <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                        <span>Status</span>
                        <span>{currentLayerMeta.status || "Not loaded"}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                        <span>Features</span>
                        <span>{currentLayerMeta.featureCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between gap-3 py-1">
                        <span>Data source</span>
                        <span className="truncate text-right">
                          {currentLayerMeta.endpoint ||
                            currentLayerConfig.endpoint ||
                            "Not connected"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

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
                      const currentLayerConfig =
                        RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key] || {};
                      const CategorizedRoadLegend =
                        currentLayerConfig.LegendComponent;

                      return (
                        <div key={layer.key}>
                          <LayerItem
                            checked={!!currentLayerState.checked}
                            color={currentLayerState.color || layer.color}
                            label={layer.label}
                            opacity={currentLayerState.opacity ?? 100}
                            dropdownOpen={!!currentLayerState.dropdownOpen}
                            categorized={
                              !!currentLayerConfig.categorized ||
                              !!currentLayerConfig.categorizedServices ||
                              !!currentLayerConfig.categorizedExistingForest
                            }
                            categoryLegend={
                              currentLayerConfig.categoryLegend ||
                              (layer.key === "cityLevelServicesLayer"
                                ? CITY_LEVEL_SERVICES_LEGEND
                                : layer.key === "existingForest"
                                  ? EXISTING_FOREST_LEGEND
                                  : [])
                            }
                            categorizedColors={
                              currentLayerConfig.categorized
                                ? categorizedRoadColors[layer.key] || {}
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
                              {CategorizedRoadLegend && (
                                <CategorizedRoadLegend
                                  colors={
                                    categorizedRoadColors[layer.key] || {}
                                  }
                                  onColorChange={(roadLabel, color) =>
                                    updateCategorizedRoadColor(
                                      layer.key,
                                      roadLabel,
                                      color,
                                    )
                                  }
                                />
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
      <div className="flex min-w-0 items-center gap-2">
        <IndeterminateCheckbox
          checked={checked}
          partial={partial}
          onChange={onChange}
        />

        <span
          className="truncate cursor-pointer text-[11px] text-white/90"
          onClick={onChange}
        >
          {label}
        </span>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDropdownToggle?.();
        }}
        // className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
        // title={`Show ${label} layers`}
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
