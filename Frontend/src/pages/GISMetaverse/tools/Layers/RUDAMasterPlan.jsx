import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";

import {
  MASTER_PLANNING_BOUNDARY_COLOR,
  getMasterPlanningBoundaryOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/MasterPlanningBoundaryLayer";
import {
  MASTER_PLAN_PHASES_COLOR,
  getMasterPlanPhasesFillPaint,
  getMasterPlanPhasesLabelLayout,
  getMasterPlanPhasesLabelPaint,
  getMasterPlanPhasesOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/MasterPlanPhasesLayer";
import {
  PRECINCT_BOUNDARY_COLOR,
  getPrecinctBoundaryLabelLayout,
  getPrecinctBoundaryLabelPaint,
  getPrecinctBoundaryLinePaint,
  getPrecinctBoundaryOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/PrecinctBoundaryLayer";
import CityLevelServicesLayer, {
  CITY_LEVEL_SERVICES_LEGEND,
  DEFAULT_CITY_LEVEL_SERVICE_COLORS,
  ensureCityLevelServicePatterns,
  getCityLevelServicesCirclePaint,
  getCityLevelServicesFillPaint,
  getCityLevelServicesLinePaint,
  getCityLevelServicesOutlinePaint,
  getCityLevelServicesPatternFillPaint,
} from "./LayerManager/RudaMasterPlanLayers/CityLevelServicesLayer";
import LandUseLegend, {
  addOrUpdateLandUseLayer,
  removeLandUseLayer,
  setLandUseOpacity,
  setLandUseVisibility,
} from "./LayerManager/BaseData/LandUseLayer";
import ProposedRoadsLayer, {
  DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
  RUDA_PROPOSED_ROAD_LEGEND,
  getRudaProposedRoadLinePaint,
  getRudaProposedRoadOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/ProposedRoadsLayer";
import RTWPackagesLayer, {
  DEFAULT_RTW_PACKAGE_COLORS,
  RTW_PACKAGE_LEGEND,
  getRtwPackagesFillPaint,
  getRtwPackagesLabelLayout,
  getRtwPackagesLabelPaint,
  getRtwPackagesLinePaint,
  getRtwPackagesOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RTWLayers/RTWPackagesLayer";
import {
  RTW_ALIGNMENT_COLOR,
  getRtwAlignmentFillPaint,
  getRtwAlignmentLinePaint,
  getRtwAlignmentOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RTWLayers/RTWAlignmentLayer";
import {
  RIVER_BOUNDARY_COLOR,
  getRiverBoundaryFillPaint,
  getRiverBoundaryLinePaint,
  getRiverBoundaryOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RTWLayers/RiverBoundaryLayer";
import {
  RIVER_RAVI_COLOR,
  getRiverRaviFillPaint,
  getRiverRaviLinePaint,
  getRiverRaviOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/RTWLayers/RiverRaviLayer";
import {
  PROPOSED_WWTP_COLOR,
  getProposedWWTPFillPaint,
  getProposedWWTPLinePaint,
  getProposedWWTPOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/WWTPLayer/ProposedWWTPLayer";
import {
  WWTP_SITES_COLOR,
  getWWTPSitesFillPaint,
  getWWTPSitesLinePaint,
  getWWTPSitesOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/WWTPLayer/WWTPSitesLayer";
import {
  SWTP_SITES_COLOR,
  getSWTPSitesFillPaint,
  getSWTPSitesLinePaint,
  getSWTPSitesOutlinePaint,
} from "./LayerManager/RudaMasterPlanLayers/WWTPLayer/SWTPSitesLayer";

import {
  getCityLevelServiceGeoJSON,
  getMpPrincipleZoningGeoJSON,
  getPrecientBoundaryGeoJSON,
  getProposedRoadNetworkGeoJSON,
  getProposedWWTPGeoJSON,
  getRiverGeoJSON,
  getRiverRaviGeoJSON,
  getRtwAlignmentGeoJSON,
  getRtwPackageGeoJSON,
  getRudaGeoJSON,
  getRudaPlanningBoundaryGeoJSON,
  getSWTPSiteGeoJSON,
  getWWTPSitesGeoJSON,
} from "../../../../services/metaverseApi";

const RUDA_MASTER_PLAN_GROUPS = [
  {
    key: "masterPlanningBoundaryGroup",
    label: "Planning Boundary",
    standalone: true,
    children: [
      {
        key: "rudaPlanningBoundary",
        label: "Planning Boundary",
        color: MASTER_PLANNING_BOUNDARY_COLOR,
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
        color: MASTER_PLAN_PHASES_COLOR,
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
        color: PRECINCT_BOUNDARY_COLOR,
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
    key: "proposedRoadsGroup",
    label: "Proposed Roads",
    standalone: true,
    children: [
      { key: "rudaProposedRoads", label: "Proposed Roads", color: "#19598d" },
    ],
  },
  {
    key: "principleLandUseZoningGroup",
    label: "Principle Land Use Zoning",
    standalone: true,
    children: [
      {
        key: "principleLandUseZoning",
        label: "Principle Land Use Zoning",
        color: "#d4a72c",
        previewColors: [
          "#facc15",
          "#84cc16",
          "#22c55e",
          "#06b6d4",
          "#3b82f6",
          "#a855f7",
          "#ef4444",
        ],
      },
    ],
  },
  {
    key: "riverTrainingWorks",
    label: "River Training Works - RTW",
    children: [
      // { key: "rtwPackages", label: "RTW Packages", color: "#8b5cf6" },
      {
        key: "rtwAlignment",
        label: "RTW Alignment",
        color: RTW_ALIGNMENT_COLOR,
      },
      {
        key: "riverBoundaryLayer",
        label: "Proposed River",
        color: RIVER_BOUNDARY_COLOR,
      },
      { key: "riverRavi", label: "River 2025", color: RIVER_RAVI_COLOR },
    ],
  },

  {
    key: "wwtp",
    label: "WWTP",
    children: [
      {
        key: "proposedWWTP",
        label: "Proposed WWTP",
        color: PROPOSED_WWTP_COLOR,
      },
      { key: "wwtpSite", label: "Proposed WWTP Sites", color: WWTP_SITES_COLOR },
      { key: "swtpSite", label: "SWTP Sites", color: SWTP_SITES_COLOR },
    ],
  },
];

const BOUNDARY_FILTER = [
  "match",
  ["geometry-type"],
  ["Polygon", "MultiPolygon", "LineString", "MultiLineString"],
  true,
  false,
];

const RUDA_MASTER_PLAN_LAYER_CONFIG = {
  rudaPlanningBoundary: {
    endpoint: "/ruda-planning-boundary/",
    fetchGeoJSON: getRudaPlanningBoundaryGeoJSON,
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getMasterPlanningBoundaryOutlinePaint,
    getLinePaint: getMasterPlanningBoundaryOutlinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  masterPlanPhases: {
    endpoint: "/ruda/",
    fetchGeoJSON: getRudaGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getMasterPlanPhasesFillPaint,
    getOutlinePaint: getMasterPlanPhasesOutlinePaint,
    getLinePaint: getMasterPlanPhasesOutlinePaint,
    getLabelLayout: getMasterPlanPhasesLabelLayout,
    getLabelPaint: getMasterPlanPhasesLabelPaint,
    labelMinZoom: 6,
    outlineLineCap: "round",
    lineCap: "round",
  },
  precinctBoundaryLayer: {
    endpoint: "/precient-boundary/",
    fetchGeoJSON: getPrecientBoundaryGeoJSON,
    hidePolygonFill: true,
    paintUsesLayerColor: true,
    getOutlinePaint: getPrecinctBoundaryOutlinePaint,
    getLinePaint: getPrecinctBoundaryLinePaint,
    lineFilter: BOUNDARY_FILTER,
    getLabelLayout: getPrecinctBoundaryLabelLayout,
    getLabelPaint: getPrecinctBoundaryLabelPaint,
    labelMinZoom: 10,
    outlineLineCap: "round",
    lineCap: "round",
  },
  cityLevelServicesLayer: {
    endpoint: "/city-level-service/",
    fetchGeoJSON: getCityLevelServiceGeoJSON,
    categorized: true,
    categoryLegend: CITY_LEVEL_SERVICES_LEGEND,
    defaultCategoryColors: DEFAULT_CITY_LEVEL_SERVICE_COLORS,
    LegendComponent: CityLevelServicesLayer,
    ensureMapImages: ensureCityLevelServicePatterns,
    getFillPaint: getCityLevelServicesFillPaint,
    getPatternFillPaint: getCityLevelServicesPatternFillPaint,
    getOutlinePaint: getCityLevelServicesOutlinePaint,
    getLinePaint: getCityLevelServicesLinePaint,
    getCirclePaint: getCityLevelServicesCirclePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rtwPackages: {
    endpoint: "/rtwpackage/",
    fetchGeoJSON: getRtwPackageGeoJSON,
    categorized: true,
    categoryLegend: RTW_PACKAGE_LEGEND,
    defaultCategoryColors: DEFAULT_RTW_PACKAGE_COLORS,
    LegendComponent: RTWPackagesLayer,
    getFillPaint: getRtwPackagesFillPaint,
    getOutlinePaint: getRtwPackagesOutlinePaint,
    getLinePaint: getRtwPackagesLinePaint,
    getLabelLayout: getRtwPackagesLabelLayout,
    getLabelPaint: getRtwPackagesLabelPaint,
    labelMinZoom: 10,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rtwAlignment: {
    endpoint: "/rtwalignment/",
    fetchGeoJSON: getRtwAlignmentGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getRtwAlignmentFillPaint,
    getOutlinePaint: getRtwAlignmentOutlinePaint,
    getLinePaint: getRtwAlignmentLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  riverBoundaryLayer: {
    endpoint: "/river/",
    fetchGeoJSON: getRiverGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getRiverBoundaryFillPaint,
    getOutlinePaint: getRiverBoundaryOutlinePaint,
    getLinePaint: getRiverBoundaryLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  riverRavi: {
    endpoint: "/river-ravi/",
    fetchGeoJSON: getRiverRaviGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getRiverRaviFillPaint,
    getOutlinePaint: getRiverRaviOutlinePaint,
    getLinePaint: getRiverRaviLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  rudaProposedRoads: {
    endpoint: "/proposed-road-network/",
    fetchGeoJSON: getProposedRoadNetworkGeoJSON,
    categorized: true,
    categoryLegend: RUDA_PROPOSED_ROAD_LEGEND,
    defaultCategoryColors: DEFAULT_RUDA_PROPOSED_ROAD_COLORS,
    LegendComponent: ProposedRoadsLayer,
    getOutlinePaint: getRudaProposedRoadOutlinePaint,
    getLinePaint: getRudaProposedRoadLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  principleLandUseZoning: {
    endpoint: "/mp-principle-zoning/",
    fetchGeoJSON: getMpPrincipleZoningGeoJSON,
    customLandUseStyle: true,
    LegendComponent: LandUseLegend,
  },
  proposedWWTP: {
    endpoint: "/proposed-wwtp/",
    fetchGeoJSON: getProposedWWTPGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getProposedWWTPFillPaint,
    getOutlinePaint: getProposedWWTPOutlinePaint,
    getLinePaint: getProposedWWTPLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  wwtpSite: {
    endpoint: "/wwtp-sites/",
    fetchGeoJSON: getWWTPSitesGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getWWTPSitesFillPaint,
    getOutlinePaint: getWWTPSitesOutlinePaint,
    getLinePaint: getWWTPSitesLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
  swtpSite: {
    endpoint: "/swtp-site/",
    fetchGeoJSON: getSWTPSiteGeoJSON,
    paintUsesLayerColor: true,
    getFillPaint: getSWTPSitesFillPaint,
    getOutlinePaint: getSWTPSitesOutlinePaint,
    getLinePaint: getSWTPSitesLinePaint,
    outlineLineCap: "round",
    lineCap: "round",
  },
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
    patternFillId: `${base}-pattern-fill`,
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

const normalizeGeoJSON = (geojson) => {
  if (geojson?.type === "FeatureCollection") return geojson;
  if (geojson?.features) {
    return { type: "FeatureCollection", features: geojson.features };
  }
  if (Array.isArray(geojson)) {
    return { type: "FeatureCollection", features: geojson };
  }
  return { type: "FeatureCollection", features: [] };
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const applyPaintObject = (map, layerId, paint = {}) => {
  Object.entries(paint).forEach(([property, value]) => {
    setPaint(map, layerId, property, value);
  });
};

const setLayoutVisibility = (map, layerId, visible) => {
  if (map?.getLayer?.(layerId)) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }
};

const resolveStyleValue = ({ layerKey, color, config, categorizedColors }) => {
  if (config.categorized) {
    return categorizedColors?.[layerKey] || config.defaultCategoryColors || {};
  }

  return color;
};

const getFillPaint = ({ styleValue, opacityRatio, config, color }) => {
  if (typeof config.getFillPaint === "function") {
    return config.getFillPaint(styleValue, opacityRatio);
  }

  return {
    "fill-color": color,
    "fill-opacity": config.hidePolygonFill ? 0 : 0.35 * opacityRatio,
  };
};

const getOutlinePaint = ({ styleValue, opacityRatio, config, color }) => {
  if (typeof config.getOutlinePaint === "function") {
    return config.getOutlinePaint(styleValue, opacityRatio);
  }

  return {
    "line-color": color,
    "line-width": 1.2,
    "line-opacity": 0.95 * opacityRatio,
  };
};

const getLinePaint = ({ styleValue, opacityRatio, config, color }) => {
  if (typeof config.getLinePaint === "function") {
    return config.getLinePaint(styleValue, opacityRatio);
  }

  return {
    "line-color": color,
    "line-width": config.lineWidth || 1.8,
    "line-opacity": opacityRatio,
  };
};

const getCirclePaint = ({ styleValue, opacityRatio, config, color }) => {
  if (typeof config.getCirclePaint === "function") {
    return config.getCirclePaint(styleValue, opacityRatio);
  }

  return {
    "circle-radius": config.circleRadius || 4.5,
    "circle-color": color,
    "circle-opacity": opacityRatio,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1,
    "circle-stroke-opacity": opacityRatio,
  };
};

const applyRudaLayerPaint = (
  map,
  layerKey,
  color,
  opacity,
  config = {},
  categorizedColors = {},
) => {
  if (!map) return;

  const opacityRatio = getOpacityRatio(opacity);
  const ids = getLayerIds(layerKey);
  const styleValue = resolveStyleValue({
    layerKey,
    color,
    config,
    categorizedColors,
  });
  const paintContext = {
    styleValue,
    opacityRatio,
    config,
    color,
  };

  applyPaintObject(map, ids.fillId, getFillPaint(paintContext));

  if (typeof config.getPatternFillPaint === "function") {
    applyPaintObject(
      map,
      ids.patternFillId,
      config.getPatternFillPaint(styleValue, opacityRatio),
    );
  }

  applyPaintObject(map, ids.outlineId, getOutlinePaint(paintContext));

  if (typeof config.getCasingPaint === "function") {
    applyPaintObject(
      map,
      ids.casingId,
      config.getCasingPaint(styleValue, opacityRatio),
    );
  }

  applyPaintObject(map, ids.lineId, getLinePaint(paintContext));

  if (typeof config.getOverlayPaint === "function") {
    applyPaintObject(
      map,
      ids.overlayId,
      config.getOverlayPaint(styleValue, opacityRatio),
    );
  }

  applyPaintObject(map, ids.circleId, getCirclePaint(paintContext));

  if (typeof config.getLabelPaint === "function") {
    applyPaintObject(map, ids.labelId, config.getLabelPaint(opacityRatio));
  }
};

const setRudaLayerVisibility = (map, layerKey, visible) => {
  if (!map) return;

  const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
  if (config?.customLandUseStyle) {
    setLandUseVisibility(map, visible);
    return;
  }

  const ids = getLayerIds(layerKey);

  [
    ids.fillId,
    ids.patternFillId,
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
  categorizedColors = {},
}) => {
  if (!map) return;

  const ids = getLayerIds(layerKey);
  const data = normalizeGeoJSON(geojson);
  const opacityRatio = getOpacityRatio(opacity);
  const visibility = "visible";
  const styleValue = resolveStyleValue({
    layerKey,
    color,
    config,
    categorizedColors,
  });
  const paintContext = {
    styleValue,
    opacityRatio,
    config,
    color,
  };

  config.ensureMapImages?.(map);

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
      filter: config.fillFilter || POLYGON_FILTER,
      layout: { visibility },
      paint: getFillPaint(paintContext),
    });
  }

  if (
    typeof config.getPatternFillPaint === "function" &&
    !map.getLayer(ids.patternFillId)
  ) {
    map.addLayer({
      id: ids.patternFillId,
      type: "fill",
      source: ids.sourceId,
      filter: config.patternFillFilter || POLYGON_FILTER,
      layout: { visibility },
      paint: config.getPatternFillPaint(styleValue, opacityRatio),
    });
  }

  if (!map.getLayer(ids.outlineId)) {
    map.addLayer({
      id: ids.outlineId,
      type: "line",
      source: ids.sourceId,
      filter: config.outlineFilter || POLYGON_FILTER,
      layout: {
        visibility,
        "line-cap": config.outlineLineCap || "round",
        "line-join": config.outlineLineJoin || "round",
      },
      paint: getOutlinePaint(paintContext),
    });
  }

  const lineLayout = {
    visibility,
    "line-cap": config.lineCap || "round",
    "line-join": config.lineJoin || "round",
  };

  if (
    typeof config.getCasingPaint === "function" &&
    !map.getLayer(ids.casingId)
  ) {
    map.addLayer({
      id: ids.casingId,
      type: "line",
      source: ids.sourceId,
      filter: config.casingFilter || LINE_FILTER,
      layout: {
        ...lineLayout,
        "line-cap": config.casingLineCap || lineLayout["line-cap"],
      },
      paint: config.getCasingPaint(styleValue, opacityRatio),
    });
  }

  if (!map.getLayer(ids.lineId)) {
    map.addLayer({
      id: ids.lineId,
      type: "line",
      source: ids.sourceId,
      filter: config.lineFilter || LINE_FILTER,
      layout: lineLayout,
      paint: getLinePaint(paintContext),
    });
  }

  if (
    typeof config.getOverlayPaint === "function" &&
    !map.getLayer(ids.overlayId)
  ) {
    map.addLayer({
      id: ids.overlayId,
      type: "line",
      source: ids.sourceId,
      filter: config.overlayFilter || LINE_FILTER,
      layout: {
        ...lineLayout,
        "line-cap": config.overlayLineCap || lineLayout["line-cap"],
      },
      paint: config.getOverlayPaint(styleValue, opacityRatio),
    });
  }

  if (!map.getLayer(ids.circleId)) {
    map.addLayer({
      id: ids.circleId,
      type: "circle",
      source: ids.sourceId,
      filter: config.circleFilter || POINT_FILTER,
      layout: { visibility },
      paint: getCirclePaint(paintContext),
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
      filter: config.labelFilter || POLYGON_FILTER,
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

  applyRudaLayerPaint(map, layerKey, color, opacity, config, categorizedColors);
  setRudaLayerVisibility(map, layerKey, true);
};

const removeRudaMapLayer = (map, layerKey) => {
  if (!map || typeof map.getStyle !== "function") return;

  if (RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey]?.customLandUseStyle) {
    removeLandUseLayer(map);
    return;
  }

  try {
    if (!map.getStyle()) return;
  } catch {
    return;
  }

  const ids = getLayerIds(layerKey);

  [
    ids.labelId,
    ids.circleId,
    ids.overlayId,
    ids.lineId,
    ids.casingId,
    ids.outlineId,
    ids.patternFillId,
    ids.fillId,
  ].forEach((id) => {
    try {
      if (map.getLayer(id)) map.removeLayer(id);
    } catch {
      // Map may already be destroyed during component cleanup.
    }
  });

  try {
    if (map.getSource(ids.sourceId)) map.removeSource(ids.sourceId);
  } catch {
    // Map may already be destroyed during component cleanup.
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

const createInitialCategorizedColors = () =>
  Object.entries(RUDA_MASTER_PLAN_LAYER_CONFIG).reduce(
    (colors, [layerKey, config]) => {
      if (config.categorized) {
        colors[layerKey] = { ...(config.defaultCategoryColors || {}) };
      }
      return colors;
    },
    {},
  );

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
  const [layerMeta, setLayerMeta] = useState({});
  const [categorizedColors, setCategorizedColors] = useState(
    createInitialCategorizedColors,
  );

  const loadedGeoJSONRef = useRef({});
  const layerRequestsRef = useRef({});
  const layerStateRef = useRef(layerState);
  const zoomOnLoadRef = useRef({});
  const categorizedColorsRef = useRef(categorizedColors);

  useEffect(() => {
    layerStateRef.current = layerState;
  }, [layerState]);

  const setLayerStateSynced = (updater) => {
    const currentState = layerStateRef.current;
    const nextState =
      typeof updater === "function" ? updater(currentState) : updater;

    layerStateRef.current = nextState;
    setLayerState(nextState);
    return nextState;
  };

  useEffect(() => {
    categorizedColorsRef.current = categorizedColors;
  }, [categorizedColors]);

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
          geometry.geometries?.forEach((geometryItem) => {
            extendBounds(bounds, geometryItem.coordinates);
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
      const currentState = layerStateRef.current[layerKey] || state;
      if (!currentState?.checked) return;

      if (config.customLandUseStyle) {
        addOrUpdateLandUseLayer(map, geojson, currentState.opacity ?? 100);
      } else {
        addOrUpdateRudaMapLayer({
          map,
          layerKey,
          geojson,
          color:
            currentState.color || layerLookup[layerKey]?.color || "#6bb7e8",
          opacity: currentState.opacity ?? 100,
          config,
          categorizedColors: categorizedColorsRef.current,
        });
      }

      if (shouldZoom) zoomToGeoJSON(geojson);
    });
  };

  const loadRudaLayer = async (layerKey, state, shouldZoom = false) => {
    const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
    if (!map || !config) return null;

    if (loadedGeoJSONRef.current[layerKey]) {
      applyVisibleLayer(layerKey, state, shouldZoom);
      setLayerMeta((previous) => ({
        ...previous,
        [layerKey]: {
          status: "Loaded",
          endpoint: config.endpoint,
          featureCount: getFeatureCount(loadedGeoJSONRef.current[layerKey]),
        },
      }));
      return loadedGeoJSONRef.current[layerKey];
    }

    if (layerRequestsRef.current[layerKey]) {
      const geojson = await layerRequestsRef.current[layerKey];
      if (geojson && layerStateRef.current[layerKey]?.checked) {
        applyVisibleLayer(
          layerKey,
          layerStateRef.current[layerKey],
          shouldZoom,
        );
      }
      return geojson;
    }

    setLayerMeta((previous) => ({
      ...previous,
      [layerKey]: {
        status: "Loading",
        endpoint: config.endpoint,
        featureCount: 0,
      },
    }));

    const request = (async () => {
      try {
        const geojson = normalizeGeoJSON(await config.fetchGeoJSON());
        loadedGeoJSONRef.current[layerKey] = geojson;

        setLayerMeta((previous) => ({
          ...previous,
          [layerKey]: {
            status: "Loaded",
            endpoint: config.endpoint,
            featureCount: getFeatureCount(geojson),
          },
        }));

        return geojson;
      } catch (error) {
        console.error(`RUDA Master Plan layer load failed: ${layerKey}`, error);

        setLayerMeta((previous) => ({
          ...previous,
          [layerKey]: {
            status: "Error",
            endpoint: config.endpoint,
            featureCount: 0,
          },
        }));
        return null;
      } finally {
        delete layerRequestsRef.current[layerKey];
      }
    })();

    layerRequestsRef.current[layerKey] = request;
    const geojson = await request;

    if (geojson && layerStateRef.current[layerKey]?.checked) {
      applyVisibleLayer(layerKey, layerStateRef.current[layerKey], shouldZoom);
    }

    return geojson;
  };

  // Each layer is controlled explicitly from its own toggle handler.
  // Avoid running through every layer whenever any checkbox, opacity, colour,
  // or details dropdown changes, because queued Mapbox style callbacks from
  // unrelated layers can otherwise restore/hide the wrong layer later.
  useEffect(() => {
    if (!map) return;

    Object.entries(layerStateRef.current).forEach(([layerKey, state]) => {
      if (state?.checked) {
        void loadRudaLayer(layerKey, state, false);
      } else {
        setRudaLayerVisibility(map, layerKey, false);
      }
    });
  }, [map]);

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
    if (!map || !open) return;

    Object.entries(layerStateRef.current).forEach(([layerKey, state]) => {
      if (!state?.checked) return;
      loadRudaLayer(layerKey, state, false);
    });
  }, [map, open]);

  useEffect(() => {
    if (!map) return undefined;

    return () => {
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
    const updated = setLayerStateSynced((previous) => {
      const allSelected = group.children.every(
        (layer) => previous[layer.key]?.checked,
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
        { ...previous },
      );
    });

    setGroupDropdowns((previous) => ({
      ...previous,
      [group.key]: true,
    }));

    if (!map) return;

    group.children.forEach((layer) => {
      const state = updated[layer.key];
      if (state?.checked) {
        void loadRudaLayer(layer.key, state, false);
      } else {
        setRudaLayerVisibility(map, layer.key, false);
      }
    });
  };

  const toggleGroupDropdown = (groupKey) => {
    setGroupDropdowns((previous) => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }));
  };

  const toggleLayer = (layerKey) => {
    const currentLayerState = layerStateRef.current[layerKey] || {};
    const willBeChecked = !currentLayerState.checked;

    const nextState = setLayerStateSynced((previous) => ({
      ...previous,
      [layerKey]: {
        ...previous[layerKey],
        checked: willBeChecked,
      },
    }));

    if (!map) return;

    if (!willBeChecked) {
      // Hide only this layer. Keep its source/data cached so it can be opened
      // again immediately and repeatedly without depending on another layer.
      delete zoomOnLoadRef.current[layerKey];
      setRudaLayerVisibility(map, layerKey, false);
      return;
    }

    // Load or restore only the selected layer. The current ref is already
    // synchronized, so async completion cannot use stale checkbox state.
    void loadRudaLayer(layerKey, nextState[layerKey], true);
  };

  const updateLayerColor = (layerKey, color) => {
    setLayerStateSynced((previous) => ({
      ...previous,
      [layerKey]: {
        ...previous[layerKey],
        color,
      },
    }));

    applyRudaLayerPaint(
      map,
      layerKey,
      color,
      layerStateRef.current[layerKey]?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey],
      categorizedColorsRef.current,
    );
  };

  const updateLayerOpacity = (layerKey, opacity) => {
    setLayerStateSynced((previous) => ({
      ...previous,
      [layerKey]: {
        ...previous[layerKey],
        opacity,
      },
    }));

    const config = RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey];
    if (config?.customLandUseStyle) {
      setLandUseOpacity(map, opacity);
      return;
    }

    applyRudaLayerPaint(
      map,
      layerKey,
      layerStateRef.current[layerKey]?.color || layerLookup[layerKey]?.color,
      opacity,
      config,
      categorizedColorsRef.current,
    );
  };

  const updateCategorizedColor = (layerKey, categoryLabel, color) => {
    const nextLayerColors = {
      ...(categorizedColorsRef.current[layerKey] || {}),
      [categoryLabel]: color,
    };
    const nextColors = {
      ...categorizedColorsRef.current,
      [layerKey]: nextLayerColors,
    };

    categorizedColorsRef.current = nextColors;
    setCategorizedColors(nextColors);

    applyRudaLayerPaint(
      map,
      layerKey,
      layerStateRef.current[layerKey]?.color ||
        layerLookup[layerKey]?.color ||
        "#6bb7e8",
      layerStateRef.current[layerKey]?.opacity ?? 100,
      RUDA_MASTER_PLAN_LAYER_CONFIG[layerKey],
      nextColors,
    );
  };

  const toggleLayerDropdown = (layerKey) => {
    setLayerStateSynced((previous) => ({
      ...previous,
      [layerKey]: {
        ...previous[layerKey],
        dropdownOpen: !previous[layerKey]?.dropdownOpen,
      },
    }));
  };

  const renderLayer = (layer) => {
    const currentLayerState = layerState[layer.key] || {};
    const currentLayerMeta = layerMeta[layer.key] || {};
    const currentLayerConfig = RUDA_MASTER_PLAN_LAYER_CONFIG[layer.key] || {};

    return (
      <div key={layer.key}>
        <LayerItem
          checked={Boolean(currentLayerState.checked)}
          color={currentLayerState.color || layer.color}
          label={layer.label}
          opacity={currentLayerState.opacity ?? 100}
          dropdownOpen={Boolean(currentLayerState.dropdownOpen)}
          categorized={Boolean(currentLayerConfig.categorized)}
          categoryLegend={currentLayerConfig.categoryLegend || []}
          categorizedColors={categorizedColors[layer.key] || {}}
          previewColors={layer.previewColors || []}
          onChange={() => toggleLayer(layer.key)}
          onColorChange={(value) => updateLayerColor(layer.key, value)}
          onOpacityChange={(value) => updateLayerOpacity(layer.key, value)}
          onDropdownToggle={() => toggleLayerDropdown(layer.key)}
        />

        {currentLayerState.dropdownOpen && (
          <LayerDetails
            layerKey={layer.key}
            config={currentLayerConfig}
            meta={currentLayerMeta}
            categorizedColors={categorizedColors[layer.key] || {}}
            onCategorizedColorChange={(categoryLabel, color) =>
              updateCategorizedColor(layer.key, categoryLabel, color)
            }
          />
        )}
      </div>
    );
  };

  const allLayerKeys = Object.keys(layerState);
  const allOn = allLayerKeys.every((k) => layerState[k]?.checked);

  const toggleAllRudaLayers = (e) => {
    e.stopPropagation();

    const currentState = layerStateRef.current;
    const currentlyAllOn = allLayerKeys.every(
      (key) => currentState[key]?.checked,
    );
    const next = !currentlyAllOn;

    const updated = { ...currentState };
    allLayerKeys.forEach((key) => {
      if (next) {
        zoomOnLoadRef.current[key] = false;
      }

      updated[key] = {
        ...updated[key],
        checked: next,
      };
    });

    setLayerStateSynced(updated);

    if (!map) return;

    if (!next) {
      allLayerKeys.forEach((key) => {
        setRudaLayerVisibility(map, key, false);
      });
      return;
    }

    // Restore every selected layer explicitly from its cached GeoJSON or its
    // own in-progress request. Keeping the ref synchronized before restoring
    // prevents the second and later toggle cycles from treating the other
    // layers as unchecked and leaving only one layer visible.
    void Promise.all(
      allLayerKeys.map((key) => loadRudaLayer(key, updated[key], false)),
    ).then(() => {
      allLayerKeys.forEach((key) => {
        if (layerStateRef.current[key]?.checked) {
          setRudaLayerVisibility(map, key, true);
        }
      });
    });
  };

  return (
    <div className="border-b border-[#343c4c]">
      <div className="flex w-full items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>MASTER PLAN</span>
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {/* Toggle-all switch */}
        <button
          type="button"
          title={
            allOn
              ? "Hide all RUDA Master Plan layers"
              : "Show all RUDA Master Plan layers"
          }
          onClick={toggleAllRudaLayers}
          className={`relative ml-2 h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors duration-200 focus:outline-none ${
            allOn ? "bg-[#65c96b]" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              allOn ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {RUDA_MASTER_PLAN_GROUPS.map((group) => {
            if (group.standalone) {
              return (
                <div key={group.key} className="mt-3 first:mt-1">
                  {renderLayer(group.children[0])}
                </div>
              );
            }

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
                  <div className="mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-2 pb-2 pt-1">
                    {group.children.map(renderLayer)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LayerDetails({
  layerKey,
  config,
  meta,
  categorizedColors,
  onCategorizedColorChange,
}) {
  const LegendComponent = config.LegendComponent;

  return (
    <div
      className={`ml-6 mt-2 max-h-64 rounded-sm border border-[#13593f]/30 bg-[#06291f] px-3 py-2 text-[11px] text-white/70 ${LAYER_PANEL_SCROLL}`}
    >
      {LegendComponent && (
        <LegendComponent
          colors={categorizedColors}
          onColorChange={onCategorizedColorChange}
        />
      )}

      <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
        <span>Features</span>
        <span>{meta.featureCount ?? 0}</span>
      </div>
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
          className="truncate cursor-pointer text-[11px]"
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
  previewColors = [],
  onChange,
  onColorChange,
  onOpacityChange,
  onDropdownToggle,
}) {
  const stopColorEvent = (event) => {
    event.stopPropagation();
  };

  const handleColorChange = (event) => {
    event.stopPropagation();
    onColorChange?.(event.target.value);
  };

  const paletteItems = previewColors.length
    ? previewColors.map((itemColor, index) => ({
        label: `${label}-${index}`,
        color: itemColor,
      }))
    : categoryLegend;

  const categorizedGradient = `linear-gradient(90deg, ${paletteItems
    .map((item, index) => {
      const categoryCount = Math.max(paletteItems.length, 1);
      const start = index * (100 / categoryCount);
      const end = (index + 1) * (100 / categoryCount);
      const itemColor = previewColors.length
        ? item.color
        : categorizedColors[item.label] || item.color;
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
              categorized || previewColors.length
                ? {
                    background: categorizedGradient,
                    borderColor: "rgba(255,255,255,0.6)",
                  }
                : { backgroundColor: color, borderColor: color }
            }
            title={
              categorized || previewColors.length
                ? `${label} classified colours - expand details to view them`
                : `Change ${label} color`
            }
            onClick={stopColorEvent}
            onMouseDown={stopColorEvent}
          >
            <input
              type="color"
              value={color}
              disabled={categorized || previewColors.length > 0}
              aria-label={
                categorized || previewColors.length > 0
                  ? `${label} classified colors`
                  : `Change ${label} color`
              }
              onClick={stopColorEvent}
              onMouseDown={stopColorEvent}
              onInput={handleColorChange}
              onChange={handleColorChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>

          <span className="truncate text-[11px]">{label}</span>
        </label>

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
