import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { LAYER_PANEL_SCROLL } from "./_layerScroll";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import MauzaBoundaryAttribute from "./AttributeTable/MauzaBoundaryAttribute";
import KhasraBoundaryAttribute from "./AttributeTable/KhasraBoundaryAttribute";
import SquareBoundaryAttribute from "./AttributeTable/SquareBoundaryAttribute";
import AwardedLandAttribute from "./AttributeTable/AwardedLandAttribute";
import StateLandAttribute from "./AttributeTable/StateLandAttribute";
import PossessionLandAttribute from "./AttributeTable/PossessionLandAttribute";
import GeodeticNetworkAttribute from "./AttributeTable/GeodeticNetworkAttribute";
import { addAwardedLandLayer } from "./LayerManager/Cadastral/AwardedLandLayer";
import { addStateLandLayer } from "./LayerManager/Cadastral/StateLandLayer";
import { addPossessionLandLayer } from "./LayerManager/Cadastral/PossessionLandLayer";
import {
  addGeodeticPointsLayer,
  GEODETIC_POINTS_IDS,
} from "./LayerManager/Cadastral/GeodeticPointsLayer";
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

const MASAWI_SOURCE = "gis-handu-gujran-ortho-source";
const MASAWI_LAYER = "gis-handu-gujran-ortho-layer";
const MASAWI_TILE_URL =
  "https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

const MASAWI_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

const IDS = {
  moza: MAUZA_BOUNDARY_IDS,
  square: SQUARE_BOUNDARY_IDS,
  khasra: KHASRA_BOUNDARY_IDS,
};

const BOUNDARY_LAYER_CONFIG = {
  moza: { addLayer: addMauzaBoundaryLayer },
  square: { addLayer: addSquareBoundaryLayer },
  khasra: { addLayer: addKhasraBoundaryLayer },
};

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
  { key: "awardedLand", label: "Awarded Land", color: "#854F0B" },
  { key: "stateLand", label: "State Land", color: "#5F5E5A" },
  { key: "possessionLand", label: "Possession Land", color: "#27500A" },
  { key: "geodeticNetwork", label: "Geodetic Network", color: "#D92D20" },
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
  geodeticNetwork: {
    endpoint: "/geodeticnetwork/",
    sourceId: GEODETIC_POINTS_IDS.source,
    layerIds: [GEODETIC_POINTS_IDS.circle, GEODETIC_POINTS_IDS.label],
    addLayer: addGeodeticPointsLayer,
  },
};

const ALL_CADASTRAL_LAYER_DEFS = [...ALL_LAYER_DEFS, ...EXTRA_LAYER_DEFS];

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

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        duration: 900,
        maxZoom: 15,
      });
    }
  });
}

function emptyFC() {
  return { type: "FeatureCollection", features: [] };
}

const LAND_REVENUE_LAYER_ORDER = [
  IDS.moza.fill,
  IDS.moza.line,
  IDS.moza.label,
  IDS.square.fill,
  IDS.square.line,
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
  if (!map) return;

  const beforeMasterPlanLayerId = getLandRevenueBeforeId(map);

  LAND_REVENUE_LAYER_ORDER.slice()
    .reverse()
    .forEach((layerId) => {
      moveLayerSafely(map, layerId, beforeMasterPlanLayerId);
    });
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
    return [
      "coalesce",
      ["to-string", ["get", "kh"]],
      ["to-string", ["get", "KH"]],
      ["to-string", ["get", "Kh"]],
      ["to-string", ["get", "khasra_id"]],
      "",
    ];
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

    if (!bounds.isEmpty())
      map.fitBounds(bounds, { padding: 40, duration: 900 });
  });
}

function addOrUpdatePolygonLayer(map, key, geojson, opacity, color) {
  const config = BOUNDARY_LAYER_CONFIG[key];
  if (!map || !config || !geojson) return;

  config.addLayer(
    map,
    geojson,
    color,
    opacity / 100,
    getLandRevenueBeforeId(map),
  );

  reorderLandRevenueLayers(map);
}

function hideLayer(map, key) {
  if (!map) return;

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

function updateOpacity(map, key, opacity, geojson, color) {
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
    addOrUpdatePolygonLayer(map, key, geojson, opacity, color);
  }
}

function updateColor(map, key, color, geojson, opacity) {
  if (!map || key === "masawi" || !geojson) return;
  addOrUpdatePolygonLayer(map, key, geojson, opacity, color);
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

  map.fitBounds(MASAWI_BOUNDS, { padding: 50, duration: 1500 });
}

export default function Cadastral({ map, selectedProjectId }) {
  const [mauzas, setMauzas] = useState([]);
  const [selectedMauzas, setSelectedMauzas] = useState([]);
  const [mauzaPanelOpen, setMauzaPanelOpen] = useState(false);
  const [khasraPanelOpen, setKhasraPanelOpen] = useState(false);
  const [khasraMauzas, setKhasraMauzas] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null);
  const [extraDetailsOpen, setExtraDetailsOpen] = useState({});

  const cachedData = useRef({});

  const [layers, setLayers] = useState(() =>
    Object.fromEntries(
      ALL_CADASTRAL_LAYER_DEFS.map((d) => [
        d.key,
        { visible: false, opacity: 100, color: d.color, loading: false },
      ]),
    ),
  );

  const selectedProjectKey = selectedProjectId ? String(selectedProjectId) : "";
  const hasSelectedProject = Boolean(selectedProjectKey);

  const setVisible = (key, visible) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], visible } }));
  };

  const setOpacity = (key, opacity) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], opacity } }));

    if (EXTRA_LAYER_CONFIG[key]) {
      const geojson = cachedData.current[key];
      if (geojson && layers[key]?.visible) {
        EXTRA_LAYER_CONFIG[key].addLayer(
          map,
          geojson,
          layers[key].color,
          opacity / 100,
        );
      }
      return;
    }

    const geojson = key === "moza" ? mauzaGeojson : cachedData.current[key];
    updateOpacity(map, key, opacity, geojson, layers[key]?.color);
  };

  const setColor = (key, color) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], color } }));

    if (EXTRA_LAYER_CONFIG[key]) {
      const geojson = cachedData.current[key];
      if (geojson && layers[key]?.visible) {
        EXTRA_LAYER_CONFIG[key].addLayer(
          map,
          geojson,
          color,
          layers[key].opacity / 100,
        );
      }
      return;
    }

    const geojson = key === "moza" ? mauzaGeojson : cachedData.current[key];
    updateColor(map, key, color, geojson, layers[key]?.opacity ?? 100);
  };

  const setLoading = (key, loading) => {
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

  const khasraGeojson = cachedData.current.khasra || emptyFC();
  const squareGeojson = cachedData.current.square || emptyFC();

  const loadProjectMauzas = async ({ draw = false, zoom = false } = {}) => {
    if (!map) return emptyFC();

    if (cachedData.current.moza?.features?.length) {
      const cachedGeojson = cachedData.current.moza;

      if (draw) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          cachedGeojson,
          layers.moza.opacity,
          layers.moza.color,
        );
        if (zoom) fitToGeojson(map, cachedGeojson);
        setVisible("moza", true);
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

      if (draw) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          completeMauzaGeojson,
          layers.moza.opacity,
          layers.moza.color,
        );
        if (zoom) fitToGeojson(map, completeMauzaGeojson);
        setVisible("moza", true);
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

  const loadBoundaryByMauzas = async (key, _mauzaIds, { zoom = true } = {}) => {
    if (!map) return emptyFC();

    setLoading(key, true);

    try {
      // Fetch the complete Square or Khasra model directly.
      const endpoint = key === "khasra" ? "/rudakhasra/" : "/rudasquare/";
      const response = await axios.get(`${API_BASE}${endpoint}`);
      const geojson = unwrapGeoJSON(response.data);

      cachedData.current[key] = geojson;

      addOrUpdatePolygonLayer(
        map,
        key,
        geojson,
        layers[key].opacity,
        layers[key].color,
      );

      if (zoom) fitToGeojson(map, geojson);
      setVisible(key, true);

      if (key === "khasra") {
        setKhasraPanelOpen("khasra");
      }

      return geojson;
    } catch (error) {
      console.error(`Complete ${key} model load error:`, error);
      return emptyFC();
    } finally {
      setLoading(key, false);
    }
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
        const response = await axios.get(`${API_BASE}${config.endpoint}`);
        geojson = unwrapGeoJSON(response.data);
        cachedData.current[key] = geojson;
      }

      config.addLayer(
        map,
        geojson,
        layers[key].color,
        layers[key].opacity / 100,
      );
      setExtraVisibility(map, key, true);

      setVisible(key, true);
      if (zoom) fitToExtraGeoJSON(map, geojson);

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

    if (isExtraLayer) {
      await loadExtraLayer(key);
      return;
    }

    if (key === "moza") {
      await loadMauzas();
      return;
    }

    if (key === "square" || key === "khasra") {
      await loadBoundaryByMauzas(key, [], { zoom: true });
    }
  };

  useEffect(() => {
    if (!map || !layers.moza.visible) return;
    addOrUpdatePolygonLayer(
      map,
      "moza",
      mauzaGeojson,
      layers.moza.opacity,
      layers.moza.color,
    );
  }, [map, mauzaGeojson, layers.moza.visible]);

  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      reorderLandRevenueLayers(map);
    };

    map.on("styledata", handleStyleData);
    map.on("sourcedata", handleStyleData);
    reorderLandRevenueLayers(map);

    return () => {
      map.off("styledata", handleStyleData);
      map.off("sourcedata", handleStyleData);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    cachedData.current = {};
    setMauzas([]);
    setSelectedMauzas([]);
    setKhasraMauzas([]);
    setMauzaPanelOpen(false);
    setKhasraPanelOpen(false);
    setOpen(false);
    setActiveTable(null);

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
      geodeticNetwork: {
        ...prev.geodeticNetwork,
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
        ? cachedData.current.khasra?.features || []
        : key === "square"
          ? cachedData.current.square?.features || []
          : [];

    return (
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
              boundaryFeatures.map((feature, index) => {
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
              })
            )}
          </div>
        )}
      </LayerItem>
    );
  };

  const renderExtraLayerRow = (definition) => {
    const { key, label, color } = definition;
    const detailsOpen = Boolean(extraDetailsOpen[key]);
    const featureCount = cachedData.current[key]?.features?.length || 0;

    return (
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
        dropdownTitle={`Show ${label} details`}
        onChange={(checked) => handleVisible(key, checked)}
        onOpacityChange={(opacity) => setOpacity(key, opacity)}
        onColorChange={(value) => setColor(key, value)}
        colorEditable
        onDropdownToggle={() =>
          setExtraDetailsOpen((prev) => ({
            ...prev,
            [key]: !prev[key],
          }))
        }
        onTableOpen={() => setActiveTable(key)}
      >
        {detailsOpen && (
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
    );
  };

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>CADASTRAL</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

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

          {LAYER_DEFS.map((definition) => renderBoundaryRow(definition))}
          {EXTRA_LAYER_DEFS.map(renderExtraLayerRow)}
        </div>
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

      {activeTable === "geodeticNetwork" && (
        <GeodeticNetworkAttribute
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
