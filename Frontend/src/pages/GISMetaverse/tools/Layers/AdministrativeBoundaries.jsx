import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import RudaBoundaryAttribute from "./AttributeTable/RudaBoundaryAttribute";
import RudaMozaBoundaryAttribute from "./AttributeTable/RudaMozaBoundaryAttribute";
import GeodeticNetworkAttribute from "./AttributeTable/GeodeticNetworkAttribute";
import ProposedRoadAttribute from "./AttributeTable/ProposedRoadAttribute";
import RtwPackageAttribute from "./AttributeTable/RtwPackageAttribute";
import RtwAlignmentAttribute from "./AttributeTable/RtwAlignmentAttribute";
import StateLandAttribute from "./AttributeTable/StateLandAttribute";
import AwardedLandAttribute from "./AttributeTable/AwardedLandAttribute";
import PossessionLandAttribute from "./AttributeTable/PossessionLandAttribute";
import { addRtwPackageLayer } from "../../LayerManager/RtwPackageLayer";
import { addRtwAlignmentLayer } from "../../LayerManager/RtwAlignmentLayer";
import { addStateLandLayer } from "../../LayerManager/StateLandLayer";
import { addAwardedLandLayer } from "../../LayerManager/AwardedLandLayer";
import { addPossessionLandLayer } from "../../LayerManager/PossessionLandLayer";
import { API_BASE, formatNumber, getMapSourceGeoJSON, unwrapGeoJSON } from "./AttributeTable/AdminAttributeTableShell";
import { readAreaSqft, sqftToAcres } from "./AttributeTable/areaUtils";

const RUDA_BOUNDARY_LAYER_IDS = [
  "metaverse-ruda-boundary-fill",
  "metaverse-ruda-boundary-line",
  "metaverse-ruda-boundary-dash-line",
  "metaverse-ruda-boundary-label",
];

const ADMIN_LAYER_COLORS = {
  rudaBoundary: "#6bb7e8",
  rudaMauzaBoundary: "#0f3d2e",
  geodeticNetwork: "#ef4444",
  proposedRoads: "#19598d",
  rtwPackage: "#f59e0b",
  rtwAlignment: "#38bdf8",
  stateLand: "#22c55e",
  awardedLand: "#a855f7",
  possessionLand: "#ef4444",
};



const IMPORTED_ADMIN_LAYER_CONFIGS = {
  rtwPackage: {
    endpoint: "rtwpackage",
    addLayer: addRtwPackageLayer,
    layerIds: [
      "metaverse-rtw-package-fill",
      "metaverse-rtw-package-line",
      "metaverse-rtw-package-label",
    ],
  },
  rtwAlignment: {
    endpoint: "rtwalignment",
    addLayer: addRtwAlignmentLayer,
    layerIds: [
      "metaverse-rtw-alignment-fill",
      "metaverse-rtw-alignment-line",
      "metaverse-rtw-alignment-label",
    ],
  },
  stateLand: {
    endpoint: "stateland",
    addLayer: addStateLandLayer,
    layerIds: [
      "metaverse-state-land-fill",
      "metaverse-state-land-line",
      "metaverse-state-land-label",
    ],
  },
  awardedLand: {
    endpoint: "awardedland",
    addLayer: addAwardedLandLayer,
    layerIds: [
      "metaverse-awarded-land-fill",
      "metaverse-awarded-land-line",
      "metaverse-awarded-land-label",
    ],
  },
  possessionLand: {
    endpoint: "possessionland",
    addLayer: addPossessionLandLayer,
    layerIds: [
      "metaverse-possession-land-fill",
      "metaverse-possession-land-line",
      "metaverse-possession-land-label",
    ],
  },
};

const setLayerIdsVisibility = (map, layerIds = [], visible) => {
  layerIds.forEach((layerId) => {
    if (map?.getLayer?.(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
  });
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

const applyAdministrativeLayerColor = (map, key, color) => {
  if (!map || !color) return;

  switch (key) {
    case "rudaMauzaBoundary":
      setPaint(map, "metaverse-ruda-mauza-boundary-fill", "fill-color", color);
      setPaint(
        map,
        "metaverse-ruda-mauza-boundary-fill",
        "fill-outline-color",
        color,
      );
      setPaint(map, "metaverse-ruda-mauza-boundary-line", "line-color", color);
      setPaint(map, "metaverse-ruda-mauza-boundary-label", "text-color", color);
      break;

    case "geodeticNetwork":
      setPaint(map, "metaverse-geodetic-network-circle", "circle-color", color);
      setPaint(map, "metaverse-geodetic-network-label", "text-color", color);
      break;

    case "rtwPackage":
      // RTW Packages use a data-driven Mapbox color expression created in
      // RtwPackageLayer.jsx. Do not replace it with one solid panel color.
      break;

    case "rtwAlignment":
      setPaint(map, "metaverse-rtw-alignment-fill", "fill-color", color);
      setPaint(map, "metaverse-rtw-alignment-line", "line-color", color);
      setPaint(map, "metaverse-rtw-alignment-label", "text-color", color);
      break;

    case "stateLand":
      setPaint(map, "metaverse-state-land-fill", "fill-color", color);
      setPaint(map, "metaverse-state-land-line", "line-color", color);
      setPaint(map, "metaverse-state-land-label", "text-color", color);
      break;

    case "awardedLand":
      setPaint(map, "metaverse-awarded-land-fill", "fill-color", color);
      setPaint(map, "metaverse-awarded-land-line", "line-color", color);
      setPaint(map, "metaverse-awarded-land-label", "text-color", color);
      break;

    case "possessionLand":
      setPaint(map, "metaverse-possession-land-fill", "fill-color", color);
      setPaint(map, "metaverse-possession-land-line", "line-color", color);
      setPaint(map, "metaverse-possession-land-label", "text-color", color);
      break;

    default:
      break;
  }
};

const getOpacityRatio = (opacity = 100) => {
  const value = Number(opacity);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 100) / 100;
};

const applyAdministrativeLayerOpacity = (map, key, opacity = 100) => {
  if (!map) return;

  const o = getOpacityRatio(opacity);

  switch (key) {
    case "rudaBoundary":
      setPaint(map, "metaverse-ruda-boundary-fill", "fill-opacity", 0.5 * o);
      setPaint(map, "metaverse-ruda-boundary-line", "line-opacity", 0.95 * o);
      setPaint(
        map,
        "metaverse-ruda-boundary-dash-line",
        "line-opacity",
        0.9 * o,
      );
      setPaint(map, "metaverse-ruda-boundary-label", "text-opacity", o);
      break;

    case "rudaMauzaBoundary":
      setPaint(
        map,
        "metaverse-ruda-mauza-boundary-fill",
        "fill-opacity",
        0.12 * o,
      );
      setPaint(map, "metaverse-ruda-mauza-boundary-line", "line-opacity", o);
      setPaint(map, "metaverse-ruda-mauza-boundary-label", "text-opacity", o);
      break;

    case "geodeticNetwork":
      setPaint(map, "metaverse-geodetic-network-circle", "circle-opacity", o);
      setPaint(
        map,
        "metaverse-geodetic-network-circle",
        "circle-stroke-opacity",
        o,
      );
      setPaint(map, "metaverse-geodetic-network-label", "text-opacity", o);
      break;

    case "proposedRoads":
      setPaint(map, "metaverse-proposed-roads-line", "line-opacity", o);
      break;

    case "rtwPackage":
      setPaint(map, "metaverse-rtw-package-fill", "fill-opacity", 0.35 * o);
      setPaint(map, "metaverse-rtw-package-line", "line-opacity", o);
      setPaint(map, "metaverse-rtw-package-label", "text-opacity", o);
      break;

    case "rtwAlignment":
      setPaint(map, "metaverse-rtw-alignment-fill", "fill-opacity", 0.35 * o);
      setPaint(map, "metaverse-rtw-alignment-line", "line-opacity", o);
      setPaint(map, "metaverse-rtw-alignment-label", "text-opacity", o);
      break;

    case "stateLand":
      setPaint(map, "metaverse-state-land-fill", "fill-opacity", 0.35 * o);
      setPaint(map, "metaverse-state-land-line", "line-opacity", o);
      setPaint(map, "metaverse-state-land-label", "text-opacity", o);
      break;

    case "awardedLand":
      setPaint(map, "metaverse-awarded-land-fill", "fill-opacity", 0.35 * o);
      setPaint(map, "metaverse-awarded-land-line", "line-opacity", o);
      setPaint(map, "metaverse-awarded-land-label", "text-opacity", o);
      break;

    case "possessionLand":
      setPaint(map, "metaverse-possession-land-fill", "fill-opacity", 0.35 * o);
      setPaint(map, "metaverse-possession-land-line", "line-opacity", o);
      setPaint(map, "metaverse-possession-land-label", "text-opacity", o);
      break;

    default:
      break;
  }
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

const getRudaPhaseLabel = (properties = {}, phaseId = "") => {
  const candidates = [
    properties?._ruda_phase_label,
    properties?.phase,
    properties?.phase_name,
    properties?.name,
    properties?.folderpath,
    properties?.popupinfo,
    properties?.snippet,
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

const getRudaPhaseId = (feature = {}) => {
  const props = feature?.properties || {};
  return (
    props?._ruda_phase_id ??
    props?.gid ??
    feature?.id ??
    props?.id ??
    props?.oid ??
    props?.fid
  );
};

const getRudaPhaseItemsFromGeoJSON = (geojson = {}) => {
  const unique = new Map();

  (geojson?.features || []).forEach((feature) => {
    const props = feature?.properties || {};
    const id = getRudaPhaseId(feature);
    if (id === undefined || id === null || id === "") return;

    const key = String(id);
    if (unique.has(key)) return;

    unique.set(key, {
      id,
      label: getRudaPhaseLabel(props, id),
      color: props?._ruda_phase_color || getRudaPhaseColor(id),
    });
  });

  return [...unique.values()];
};

export default function AdministrativeBoundaries({
  map,
  adminBoundaryVisibility,
  setAdminBoundaryVisibility,
}) {
  const [open, setOpen] = useState(false);
  const [rudaPhaseDropdownOpen, setRudaPhaseDropdownOpen] = useState(false);
  const [rudaMauzaDropdownOpen, setRudaMauzaDropdownOpen] = useState(false);
  const [geodeticDropdownOpen, setGeodeticDropdownOpen] = useState(false);
  const [proposedRoadsDropdownOpen, setProposedRoadsDropdownOpen] = useState(false);
  const [rtwPackageDropdownOpen, setRtwPackageDropdownOpen] = useState(false);
  const [rtwAlignmentDropdownOpen, setRtwAlignmentDropdownOpen] = useState(false);
  const [stateLandDropdownOpen, setStateLandDropdownOpen] = useState(false);
  const [awardedLandDropdownOpen, setAwardedLandDropdownOpen] = useState(false);
  const [possessionLandDropdownOpen, setPossessionLandDropdownOpen] = useState(false);
  const [activeAttributeTable, setActiveAttributeTable] = useState(null);

  // Keep editable colors local to this panel so changing colors does NOT update
  // adminBoundaryVisibility and does NOT re-trigger any API/loading effects.
  const [editableColors, setEditableColors] = useState({
    rudaMauzaBoundary: ADMIN_LAYER_COLORS.rudaMauzaBoundary,
    geodeticNetwork: ADMIN_LAYER_COLORS.geodeticNetwork,
    rtwPackage: ADMIN_LAYER_COLORS.rtwPackage,
    rtwAlignment: ADMIN_LAYER_COLORS.rtwAlignment,
    stateLand: ADMIN_LAYER_COLORS.stateLand,
    awardedLand: ADMIN_LAYER_COLORS.awardedLand,
    possessionLand: ADMIN_LAYER_COLORS.possessionLand,
  });

  // Keep opacity local to this panel. Changing the slider should only repaint
  // already-loaded Mapbox layers and should not update adminBoundaryVisibility,
  // because that parent state can re-trigger API/loading effects.
  const [editableOpacities, setEditableOpacities] = useState({
    rudaBoundary: adminBoundaryVisibility?.rudaBoundaryOpacity ?? 100,
    rudaMauzaBoundary: adminBoundaryVisibility?.rudaMauzaBoundaryOpacity ?? 100,
    geodeticNetwork: adminBoundaryVisibility?.geodeticNetworkOpacity ?? 100,
    proposedRoads: adminBoundaryVisibility?.proposedRoadsOpacity ?? 100,
    rtwPackage: adminBoundaryVisibility?.rtwPackageOpacity ?? 100,
    rtwAlignment: adminBoundaryVisibility?.rtwAlignmentOpacity ?? 100,
    stateLand: adminBoundaryVisibility?.stateLandOpacity ?? 100,
    awardedLand: adminBoundaryVisibility?.awardedLandOpacity ?? 100,
    possessionLand: adminBoundaryVisibility?.possessionLandOpacity ?? 100,
  });

  const ADMIN_SOURCE_IDS = {
    rudaBoundary: "metaverse-ruda-boundary-source",
    rudaMauzaBoundary: "metaverse-ruda-mauza-boundary-source",
    geodeticNetwork: "metaverse-geodetic-network-source",
    proposedRoads: "metaverse-proposed-roads-source",
    rtwPackage: "metaverse-rtw-package-source",
    rtwAlignment: "metaverse-rtw-alignment-source",
    stateLand: "metaverse-state-land-source",
    awardedLand: "metaverse-awarded-land-source",
    possessionLand: "metaverse-possession-land-source",
  };

  const rudaPhases = adminBoundaryVisibility?.rudaPhases || [];
  const selectedRudaPhaseIds =
    adminBoundaryVisibility?.selectedRudaPhaseIds || [];

  const selectedRudaPhaseSet = useMemo(
    () => new Set(selectedRudaPhaseIds.map((id) => String(id))),
    [selectedRudaPhaseIds],
  );

  const refreshRudaPhasesFromMap = () => {
    if (!map) return [];

    try {
      const source = map.getSource(ADMIN_SOURCE_IDS.rudaBoundary);
      const data = source?._data || source?.serialize?.()?.data;
      const phases = getRudaPhaseItemsFromGeoJSON(data);

      if (phases.length) {
        setAdminBoundaryVisibility((prev) => {
          const previousSelected = prev?.selectedRudaPhaseIds || [];

          return {
            ...prev,
            rudaPhases: phases,
            selectedRudaPhaseIds: previousSelected.length
              ? previousSelected
              : phases.map((phase) => phase.id),
          };
        });
      }

      return phases;
    } catch (error) {
      console.error("RUDA phases read error:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!map || !adminBoundaryVisibility?.rudaBoundary) return;

    refreshRudaPhasesFromMap();
    const timers = [350, 900, 1400].map((delay) =>
      setTimeout(refreshRudaPhasesFromMap, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [map, adminBoundaryVisibility?.rudaBoundary]);

  useEffect(() => {
    if (!map) return;

    const selected = (adminBoundaryVisibility?.selectedRudaPhaseIds || []).map(
      (id) => String(id),
    );
    const hasPhases = (adminBoundaryVisibility?.rudaPhases || []).length > 0;
    const filter =
      adminBoundaryVisibility?.rudaBoundary && hasPhases
        ? [
          "match",
          ["to-string", ["get", "_ruda_phase_id"]],
          selected,
          true,
          false,
        ]
        : null;

    RUDA_BOUNDARY_LAYER_IDS.forEach((layerId) => {
      try {
        if (map.getLayer(layerId)) map.setFilter(layerId, filter);
      } catch (error) {
        console.error("RUDA phase filter error:", error);
      }
    });
  }, [
    map,
    adminBoundaryVisibility?.rudaBoundary,
    adminBoundaryVisibility?.rudaPhases,
    adminBoundaryVisibility?.selectedRudaPhaseIds,
  ]);

  useEffect(() => {
    if (!map) return undefined;

    const applyColors = () => {
      applyAdministrativeLayerColor(
        map,
        "rudaMauzaBoundary",
        editableColors.rudaMauzaBoundary,
      );
      applyAdministrativeLayerColor(
        map,
        "geodeticNetwork",
        editableColors.geodeticNetwork,
      );
      ["rtwAlignment", "stateLand", "awardedLand", "possessionLand"].forEach((key) => {
        applyAdministrativeLayerColor(map, key, editableColors[key]);
      });
    };

    applyColors();
    const timers = [150, 500, 1000].map((delay) =>
      setTimeout(applyColors, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [
    map,
    editableColors.rudaMauzaBoundary,
    editableColors.geodeticNetwork,
    editableColors.rtwPackage,
    editableColors.rtwAlignment,
    editableColors.stateLand,
    editableColors.awardedLand,
    editableColors.possessionLand,
    adminBoundaryVisibility?.rudaMauzaBoundary,
    adminBoundaryVisibility?.geodeticNetwork,
    adminBoundaryVisibility?.rtwPackage,
    adminBoundaryVisibility?.rtwAlignment,
    adminBoundaryVisibility?.stateLand,
    adminBoundaryVisibility?.awardedLand,
    adminBoundaryVisibility?.possessionLand,
  ]);

  useEffect(() => {
    if (!map) return undefined;

    const applyOpacities = () => {
      applyAdministrativeLayerOpacity(
        map,
        "rudaBoundary",
        editableOpacities.rudaBoundary,
      );
      applyAdministrativeLayerOpacity(
        map,
        "rudaMauzaBoundary",
        editableOpacities.rudaMauzaBoundary,
      );
      applyAdministrativeLayerOpacity(
        map,
        "geodeticNetwork",
        editableOpacities.geodeticNetwork,
      );
      applyAdministrativeLayerOpacity(
        map,
        "proposedRoads",
        editableOpacities.proposedRoads,
      );
      ["rtwPackage", "rtwAlignment", "stateLand", "awardedLand", "possessionLand"].forEach((key) => {
        applyAdministrativeLayerOpacity(map, key, editableOpacities[key]);
      });
    };

    applyOpacities();
    const timers = [150, 500, 1000].map((delay) =>
      setTimeout(applyOpacities, delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [
    map,
    editableOpacities.rudaBoundary,
    editableOpacities.rudaMauzaBoundary,
    editableOpacities.geodeticNetwork,
    editableOpacities.proposedRoads,
    editableOpacities.rtwPackage,
    editableOpacities.rtwAlignment,
    editableOpacities.stateLand,
    editableOpacities.awardedLand,
    editableOpacities.possessionLand,
    adminBoundaryVisibility?.rudaBoundary,
    adminBoundaryVisibility?.rudaMauzaBoundary,
    adminBoundaryVisibility?.geodeticNetwork,
    adminBoundaryVisibility?.proposedRoads,
    adminBoundaryVisibility?.rtwPackage,
    adminBoundaryVisibility?.rtwAlignment,
    adminBoundaryVisibility?.stateLand,
    adminBoundaryVisibility?.awardedLand,
    adminBoundaryVisibility?.possessionLand,
  ]);



  useEffect(() => {
    if (!map) return undefined;

    let cancelled = false;

    const loadImportedLayer = async (key) => {
      const config = IMPORTED_ADMIN_LAYER_CONFIGS[key];
      if (!config) return;

      const visible = Boolean(adminBoundaryVisibility?.[key]);

      if (!visible) {
        setLayerIdsVisibility(map, config.layerIds, false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/${config.endpoint}/`);
        if (cancelled) return;

        const geojson = unwrapGeoJSON(res.data);
        config.addLayer(
          map,
          geojson,
          editableColors[key] || ADMIN_LAYER_COLORS[key],
          getOpacityRatio(editableOpacities[key]),
        );
        setLayerIdsVisibility(map, config.layerIds, true);

        if (adminBoundaryVisibility?._zoomTo === key) {
          setTimeout(() => zoomToBoundarySource(key), 250);
        }
      } catch (error) {
        console.error(`${key} layer load error:`, error);
      }
    };

    Object.keys(IMPORTED_ADMIN_LAYER_CONFIGS).forEach(loadImportedLayer);

    return () => {
      cancelled = true;
    };
  }, [
    map,
    adminBoundaryVisibility?.rtwPackage,
    adminBoundaryVisibility?.rtwAlignment,
    adminBoundaryVisibility?.stateLand,
    adminBoundaryVisibility?.awardedLand,
    adminBoundaryVisibility?.possessionLand,
    adminBoundaryVisibility?._zoomToken,
    editableColors.rtwPackage,
    editableColors.rtwAlignment,
    editableColors.stateLand,
    editableColors.awardedLand,
    editableColors.possessionLand,
    editableOpacities.rtwPackage,
    editableOpacities.rtwAlignment,
    editableOpacities.stateLand,
    editableOpacities.awardedLand,
    editableOpacities.possessionLand,
  ]);

  const zoomToBoundarySource = (key) => {
    if (!map) return;

    const sourceId = ADMIN_SOURCE_IDS[key];
    if (!sourceId) return;

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

    const tryZoom = () => {
      try {
        const source = map.getSource(sourceId);
        const data = source?._data || source?.serialize?.()?.data;

        if (!data?.features?.length) return false;

        const bounds = new mapboxgl.LngLatBounds();

        data.features.forEach((feature) => {
          const geometry = feature.geometry;
          if (!geometry) return;

          if (geometry.type === "GeometryCollection") {
            geometry.geometries?.forEach((geom) => {
              extendBounds(bounds, geom.coordinates);
            });
            return;
          }

          extendBounds(bounds, geometry.coordinates);
        });

        if (bounds.isEmpty()) return false;

        map.fitBounds(bounds, {
          padding: 70,
          duration: 1200,
          maxZoom: key === "geodeticNetwork" ? 16 : 14,
        });

        return true;
      } catch (error) {
        console.error("Administrative boundary zoom error:", error);
        return false;
      }
    };

    const zoomWhenReady = () => {
      if (tryZoom()) return;
      setTimeout(tryZoom, 350);
      setTimeout(tryZoom, 900);
      setTimeout(tryZoom, 1400);
    };

    if (map.isStyleLoaded?.()) zoomWhenReady();
    else map.once("load", zoomWhenReady);
  };

  const toggleLayer = (key) => {
    const willBeVisible = !adminBoundaryVisibility?.[key];

    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
      ...(willBeVisible
        ? {
          _zoomTo: key,
          _zoomToken: Date.now(),
        }
        : {}),
    }));

    if (willBeVisible) {
      zoomToBoundarySource(key);
      if (key === "rudaBoundary") {
        setRudaPhaseDropdownOpen(true);
        setTimeout(refreshRudaPhasesFromMap, 500);
        setTimeout(refreshRudaPhasesFromMap, 1200);
      }
    }
  };

  const updateOpacity = (key, value) => {
    setEditableOpacities((prev) => ({
      ...prev,
      [key]: value,
    }));

    applyAdministrativeLayerOpacity(map, key, value);
  };

  const updateColor = (key, value) => {
    setEditableColors((prev) => ({
      ...prev,
      [key]: value,
    }));

    applyAdministrativeLayerColor(map, key, value);
  };

  const toggleRudaPhase = (phaseId) => {
    setAdminBoundaryVisibility((prev) => {
      const selected = new Set(
        (prev?.selectedRudaPhaseIds || []).map((id) => String(id)),
      );
      const stringId = String(phaseId);

      if (selected.has(stringId)) selected.delete(stringId);
      else selected.add(stringId);

      return {
        ...prev,
        selectedRudaPhaseIds: (prev?.rudaPhases || [])
          .map((phase) => phase.id)
          .filter((id) => selected.has(String(id))),
      };
    });
  };

  const selectAllRudaPhases = () => {
    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      selectedRudaPhaseIds: (prev?.rudaPhases || []).map((phase) => phase.id),
    }));
  };

  const resetRudaPhases = () => {
    setAdminBoundaryVisibility((prev) => ({
      ...prev,
      selectedRudaPhaseIds: [],
    }));
  };

  const allRudaPhasesSelected =
    rudaPhases.length > 0 &&
    rudaPhases.every((phase) => selectedRudaPhaseSet.has(String(phase.id)));

  const getLayerGeoJSON = (key) =>
    getMapSourceGeoJSON(map, ADMIN_SOURCE_IDS[key]);

  const rudaMauzaSummary = useMemo(() => {
    const geojson = getLayerGeoJSON("rudaMauzaBoundary");
    const features = geojson.features || [];
    const totalSqft = features.reduce(
      (sum, feature) => sum + readAreaSqft(feature),
      0,
    );

    return {
      count: features.length,
      totalSqft,
      totalAcres: sqftToAcres(totalSqft),
    };
  }, [map, adminBoundaryVisibility?.rudaMauzaBoundary, rudaMauzaDropdownOpen]);

  const geodeticSummary = useMemo(() => {
    const geojson = getLayerGeoJSON("geodeticNetwork");
    const features = geojson.features || [];
    const elevations = features
      .map((feature) => Number(feature?.properties?.elevation))
      .filter(Number.isFinite);
    const codes = new Set(
      features.map((feature) => feature?.properties?.code).filter(Boolean),
    );

    return {
      count: features.length,
      codeCount: codes.size,
      minElevation: elevations.length ? Math.min(...elevations) : null,
      maxElevation: elevations.length ? Math.max(...elevations) : null,
    };
  }, [map, adminBoundaryVisibility?.geodeticNetwork, geodeticDropdownOpen]);

  const proposedRoadsSummary = useMemo(() => {
    const geojson = getLayerGeoJSON("proposedRoads");
    const counts = new Map();

    (geojson.features || []).forEach((feature) => {
      const props = feature?.properties || {};
      const type =
        props.type || props.road_type || props.layer || props.name || props.refname || "Other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return [...counts.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [map, adminBoundaryVisibility?.proposedRoads, proposedRoadsDropdownOpen]);



  const importedLayerSummaries = useMemo(() => {
    const summarize = (key) => {
      const geojson = getLayerGeoJSON(key);
      const features = geojson.features || [];

      const totalSqft = features.reduce((sum, feature) => {
        const props = feature?.properties || {};
        const sqft = Number(props.area_sqft);
        if (Number.isFinite(sqft)) return sum + sqft;

        const acres = Number(props.area_acres);
        if (Number.isFinite(acres)) return sum + acres * 43560;

        return sum;
      }, 0);

      const totalAcres = features.reduce((sum, feature) => {
        const props = feature?.properties || {};
        const acres = Number(props.area_acres);
        if (Number.isFinite(acres)) return sum + acres;
        return sum;
      }, 0) || sqftToAcres(totalSqft);

      const uniqueValues = (field) =>
        new Set(
          features
            .map((feature) => feature?.properties?.[field])
            .filter((value) => value !== undefined && value !== null && value !== ""),
        ).size;

      return {
        count: features.length,
        totalSqft,
        totalAcres,
        packages: uniqueValues("package"),
        phases: uniqueValues("ruda_phase"),
        mouzas: uniqueValues("mouza"),
        districts: uniqueValues("district"),
      };
    };

    return {
      rtwPackage: summarize("rtwPackage"),
      rtwAlignment: summarize("rtwAlignment"),
      stateLand: summarize("stateLand"),
      awardedLand: summarize("awardedLand"),
      possessionLand: summarize("possessionLand"),
    };
  }, [
    map,
    adminBoundaryVisibility?.rtwPackage,
    adminBoundaryVisibility?.rtwAlignment,
    adminBoundaryVisibility?.stateLand,
    adminBoundaryVisibility?.awardedLand,
    adminBoundaryVisibility?.possessionLand,
    rtwPackageDropdownOpen,
    rtwAlignmentDropdownOpen,
    stateLandDropdownOpen,
    awardedLandDropdownOpen,
    possessionLandDropdownOpen,
  ]);

  const renderImportedLayerSummary = (summary, options = {}) => (
    <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
      <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
        <span>Total Features</span>
        <span>{summary.count}</span>
      </div>
      {options.showPackages && (
        <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
          <span>Unique Packages</span>
          <span>{summary.packages}</span>
        </div>
      )}
      {options.showPhases && (
        <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
          <span>Unique Phases</span>
          <span>{summary.phases}</span>
        </div>
      )}
      {options.showMouzas && (
        <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
          <span>Unique Mouzas</span>
          <span>{summary.mouzas}</span>
        </div>
      )}
      {summary.totalSqft > 0 && (
        <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
          <span>Total Area (sq ft)</span>
          <span>{formatNumber(summary.totalSqft)}</span>
        </div>
      )}
      <div className="flex justify-between py-1">
        <span>Total Area (acres)</span>
        <span>{formatNumber(summary.totalAcres)}</span>
      </div>
    </div>
  );

  const renderAttributeTable = () => {
    const commonProps = {
      map,
      onClose: () => setActiveAttributeTable(null),
    };

    switch (activeAttributeTable) {
      case "rudaBoundary":
        return <RudaBoundaryAttribute {...commonProps} />;
      case "rudaMauzaBoundary":
        return <RudaMozaBoundaryAttribute {...commonProps} />;
      case "geodeticNetwork":
        return <GeodeticNetworkAttribute {...commonProps} />;
      case "proposedRoads":
        return <ProposedRoadAttribute {...commonProps} />;
      case "rtwPackage":
        return <RtwPackageAttribute {...commonProps} />;
      case "rtwAlignment":
        return <RtwAlignmentAttribute {...commonProps} />;
      case "stateLand":
        return <StateLandAttribute {...commonProps} />;
      case "awardedLand":
        return <AwardedLandAttribute {...commonProps} />;
      case "possessionLand":
        return <PossessionLandAttribute {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>ADMINISTRATIVE BOUNDARIES</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          <LayerItem
            checked={adminBoundaryVisibility.rudaBoundary}
            color={ADMIN_LAYER_COLORS.rudaBoundary}
            label="Ruda Boundary"
            opacity={editableOpacities.rudaBoundary}
            onChange={() => toggleLayer("rudaBoundary")}
            onOpacityChange={(value) => updateOpacity("rudaBoundary", value)}
            hasDropdown
            dropdownOpen={rudaPhaseDropdownOpen}
            onDropdownToggle={() => {
              setRudaPhaseDropdownOpen((prev) => !prev);
              refreshRudaPhasesFromMap();
            }}
            onTableOpen={() => setActiveAttributeTable("rudaBoundary")}
          />

          {rudaPhaseDropdownOpen && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-2 py-2">
              {rudaPhases.length === 0 ? (
                <p className="px-1 py-1 text-[11px] text-white/60">
                  No phases found
                </p>
              ) : (
                <>
                  <div className="mb-1.5 flex items-center justify-between border-b border-[#343c4c] pb-1.5">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allRudaPhasesSelected}
                        onChange={(e) => {
                          if (e.target.checked) selectAllRudaPhases();
                          else resetRudaPhases();
                        }}
                        className="accent-[#65c96b]"
                      />
                      <span className="text-[11px] text-white/90">
                        Select All
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={resetRudaPhases}
                      className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[#8fd36f] hover:bg-[#0f3d2e]"
                    >
                      Reset
                    </button>
                  </div>

                  <div className={`max-h-44 pr-1 ${LAYER_PANEL_SCROLL}`}>
                    {rudaPhases.map((phase) => {
                      const checked = selectedRudaPhaseSet.has(
                        String(phase.id),
                      );

                      return (
                        <label
                          key={phase.id}
                          className="flex cursor-pointer items-center gap-2 border-b border-[#343c4c]/60 py-1.5 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRudaPhase(phase.id)}
                            className="accent-[#65c96b]"
                          />
                          <span
                            className="h-3.5 w-5 shrink-0 rounded-sm border border-white/50"
                            style={{ backgroundColor: phase.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] text-white/80">
                            {phase.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <LayerItem
            checked={adminBoundaryVisibility.rudaMauzaBoundary}
            color={editableColors.rudaMauzaBoundary}
            label="Ruda Mauza Boundary"
            opacity={editableOpacities.rudaMauzaBoundary}
            onChange={() => toggleLayer("rudaMauzaBoundary")}
            onOpacityChange={(value) =>
              updateOpacity("rudaMauzaBoundary", value)
            }
            hasDropdown
            dropdownOpen={rudaMauzaDropdownOpen}
            onDropdownToggle={() => setRudaMauzaDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("rudaMauzaBoundary")}
            colorEditable
            onColorChange={(value) => updateColor("rudaMauzaBoundary", value)}
          />

          {rudaMauzaDropdownOpen && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Mozas</span>
                <span>{rudaMauzaSummary.count}</span>
              </div>
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Area (sq ft)</span>
                <span>{formatNumber(rudaMauzaSummary.totalSqft)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Total Area (acres)</span>
                <span>{formatNumber(rudaMauzaSummary.totalAcres)}</span>
              </div>
            </div>
          )}

          <LayerItem
            checked={adminBoundaryVisibility.geodeticNetwork}
            color={editableColors.geodeticNetwork}
            label="Geodetic Network"
            opacity={editableOpacities.geodeticNetwork}
            onChange={() => toggleLayer("geodeticNetwork")}
            onOpacityChange={(value) => updateOpacity("geodeticNetwork", value)}
            hasDropdown
            dropdownOpen={geodeticDropdownOpen}
            onDropdownToggle={() => setGeodeticDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("geodeticNetwork")}
            colorEditable
            onColorChange={(value) => updateColor("geodeticNetwork", value)}
          />

          {geodeticDropdownOpen && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Total Points</span>
                <span>{geodeticSummary.count}</span>
              </div>
              <div className="flex justify-between border-b border-[#343c4c]/70 py-1">
                <span>Unique Codes</span>
                <span>{geodeticSummary.codeCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Elevation Range</span>
                <span>
                  {geodeticSummary.minElevation === null
                    ? "-"
                    : `${formatNumber(geodeticSummary.minElevation)} - ${formatNumber(geodeticSummary.maxElevation)}`}
                </span>
              </div>
            </div>
          )}

          <LayerItem
            checked={adminBoundaryVisibility.proposedRoads}
            color={ADMIN_LAYER_COLORS.proposedRoads}
            label="Proposed Roads Layer"
            opacity={editableOpacities.proposedRoads}
            onChange={() => toggleLayer("proposedRoads")}
            onOpacityChange={(value) => updateOpacity("proposedRoads", value)}
            hasDropdown
            dropdownOpen={proposedRoadsDropdownOpen}
            onDropdownToggle={() => setProposedRoadsDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("proposedRoads")}
          />

          {proposedRoadsDropdownOpen && (
            <div className="ml-6 mt-2 rounded-sm border border-[#13593f]/30 bg-[#051f17] px-3 py-2 text-[11px] text-white/80">
              {proposedRoadsSummary.length === 0 ? (
                <p className="py-1 text-white/60">No road types found</p>
              ) : (
                proposedRoadsSummary.map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between border-b border-[#343c4c]/70 py-1 last:border-b-0"
                  >
                    <span className="max-w-[150px] truncate">{type}</span>
                    <span>{count}</span>
                  </div>
                ))
              )}
            </div>
          )}

          <LayerItem
            checked={Boolean(adminBoundaryVisibility.rtwPackage)}
            color={editableColors.rtwPackage}
            label="RTW Packages"
            opacity={editableOpacities.rtwPackage}
            onChange={() => toggleLayer("rtwPackage")}
            onOpacityChange={(value) => updateOpacity("rtwPackage", value)}
            hasDropdown
            dropdownOpen={rtwPackageDropdownOpen}
            onDropdownToggle={() => setRtwPackageDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("rtwPackage")}
          // RTW Package colors are category-driven in RtwPackageLayer.jsx.
          />

          {rtwPackageDropdownOpen &&
            renderImportedLayerSummary(importedLayerSummaries.rtwPackage, {
              showPackages: true,
              showPhases: true,
            })}

          <LayerItem
            checked={Boolean(adminBoundaryVisibility.rtwAlignment)}
            color={editableColors.rtwAlignment}
            label="RTW Alignment"
            opacity={editableOpacities.rtwAlignment}
            onChange={() => toggleLayer("rtwAlignment")}
            onOpacityChange={(value) => updateOpacity("rtwAlignment", value)}
            hasDropdown
            dropdownOpen={rtwAlignmentDropdownOpen}
            onDropdownToggle={() => setRtwAlignmentDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("rtwAlignment")}
            colorEditable
            onColorChange={(value) => updateColor("rtwAlignment", value)}
          />

          {rtwAlignmentDropdownOpen &&
            renderImportedLayerSummary(importedLayerSummaries.rtwAlignment, {
              showPackages: true,
            })}

          <LayerItem
            checked={Boolean(adminBoundaryVisibility.stateLand)}
            color={editableColors.stateLand}
            label="State Land"
            opacity={editableOpacities.stateLand}
            onChange={() => toggleLayer("stateLand")}
            onOpacityChange={(value) => updateOpacity("stateLand", value)}
            hasDropdown
            dropdownOpen={stateLandDropdownOpen}
            onDropdownToggle={() => setStateLandDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("stateLand")}
            colorEditable
            onColorChange={(value) => updateColor("stateLand", value)}
          />

          {stateLandDropdownOpen &&
            renderImportedLayerSummary(importedLayerSummaries.stateLand, {
              showMouzas: true,
            })}

          <LayerItem
            checked={Boolean(adminBoundaryVisibility.awardedLand)}
            color={editableColors.awardedLand}
            label="Awarded Land"
            opacity={editableOpacities.awardedLand}
            onChange={() => toggleLayer("awardedLand")}
            onOpacityChange={(value) => updateOpacity("awardedLand", value)}
            hasDropdown
            dropdownOpen={awardedLandDropdownOpen}
            onDropdownToggle={() => setAwardedLandDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("awardedLand")}
            colorEditable
            onColorChange={(value) => updateColor("awardedLand", value)}
          />

          {awardedLandDropdownOpen &&
            renderImportedLayerSummary(importedLayerSummaries.awardedLand, {
              showMouzas: true,
            })}

          <LayerItem
            checked={Boolean(adminBoundaryVisibility.possessionLand)}
            color={editableColors.possessionLand}
            label="Possession Land"
            opacity={editableOpacities.possessionLand}
            onChange={() => toggleLayer("possessionLand")}
            onOpacityChange={(value) => updateOpacity("possessionLand", value)}
            hasDropdown
            dropdownOpen={possessionLandDropdownOpen}
            onDropdownToggle={() => setPossessionLandDropdownOpen((prev) => !prev)}
            onTableOpen={() => setActiveAttributeTable("possessionLand")}
            colorEditable
            onColorChange={(value) => updateColor("possessionLand", value)}
          />

          {possessionLandDropdownOpen &&
            renderImportedLayerSummary(importedLayerSummaries.possessionLand, {
              showMouzas: true,
            })}

        </div>
      )}

      {renderAttributeTable()}
    </div>
  );
}

function LayerItem({
  checked,
  color,
  label,
  opacity,
  onChange,
  onOpacityChange,
  hasDropdown = false,
  dropdownOpen = false,
  onDropdownToggle,
  onTableOpen,
  colorEditable = false,
  onColorChange,
}) {
  const handleColorEvent = (event) => {
    event.stopPropagation();
  };

  const handleColorChange = (event) => {
    event.stopPropagation();
    onColorChange?.(event.target.value);
  };

  return (
    <div className="mt-3 first:mt-1">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-[#65c96b]"
          />

          {colorEditable ? (
            <span
              className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border border-white/50"
              style={{ backgroundColor: color, borderColor: color }}
              title={`Change ${label} color`}
              onClick={handleColorEvent}
              onMouseDown={handleColorEvent}
            >
              <input
                type="color"
                value={color}
                aria-label={`Change ${label} color`}
                onClick={handleColorEvent}
                onMouseDown={handleColorEvent}
                onInput={handleColorChange}
                onChange={handleColorChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </span>
          ) : (
            <span
              className="h-4 w-4 rounded-sm border-2 border-white/50"
              style={{ backgroundColor: color, borderColor: color }}
            />
          )}

          <span className="text-[11px]">{label}</span>
        </label>

        <div className="flex items-center gap-1">
          {onTableOpen && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTableOpen();
              }}
              className="rounded p-0.5 text-white/70 hover:bg-[#0f3d2e] hover:text-white"
              title={`Open ${label} attribute table`}
            >
              <Grid3X3 size={14} />
            </button>
          )}

          {hasDropdown && (
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
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-6">
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="h-[3px] flex-1 cursor-pointer rounded-full bg-[#8fd36f] accent-[#65c96b]"
        />

        <span className="w-7 text-right text-[11px] text-white/90">
          {opacity}%
        </span>
      </div>
    </div>
  );
}