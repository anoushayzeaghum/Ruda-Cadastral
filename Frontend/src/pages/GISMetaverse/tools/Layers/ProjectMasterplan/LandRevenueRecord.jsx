import { useEffect, useMemo, useRef, useState } from "react";
import { LAYER_PANEL_SCROLL } from "../_layerScroll";
import {
  getProjectMauzasGeoJSON,
  getSquaresGeoJSON,
  getKhasrasGeoJSON,
} from "../../../../../services/api";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import MauzaBoundaryAttribute from "../AttributeTable/MauzaBoundaryAttribute";
import KhasraBoundaryAttribute from "../AttributeTable/KhasraBoundaryAttribute";
import SquareBoundaryAttribute from "../AttributeTable/SquareBoundaryAttribute";
import { formatNumber } from "../AttributeTable/AdminAttributeTableShell";
import { readAreaSqft } from "../AttributeTable/areaUtils";

// const MASAWI_SOURCE = "gis-handu-gujran-ortho-source";
// const MASAWI_LAYER = "gis-handu-gujran-ortho-layer";
// const MASAWI_TILE_URL =
//   "https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png";

// const MASAWI_BOUNDS = [
//   [74.42562653088396, 31.60509230706726],
//   [74.43545280361002, 31.6112165411359],
// ];

const TILESERVER_BASE = "https://rudametaverse.nespakprogresscenter.com";

function mauzaNameToTileId(mauzaName) {
  return (
    String(mauzaName || "")
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join("_") + "_Ortho"
  );
}

function getMasawiConfigForMauza(mauzaName) {
  const tileId = mauzaNameToTileId(mauzaName);
  return {
    tileId,
    sourceId: `gis-${tileId.toLowerCase()}-source`,
    layerId: `gis-${tileId.toLowerCase()}-layer`,
    tileJsonUrl: `${TILESERVER_BASE}/tiles/data/${tileId}.json`,
  };
}

const IDS = {
  moza: {
    src: "gism-lrr-moza-src",
    fill: "gism-lrr-moza-fill",
    line: "gism-lrr-moza-line",
    label: "gism-lrr-moza-label",
  },
  square: {
    src: "gism-lrr-square-src",
    fill: "gism-lrr-square-fill",
    line: "gism-lrr-square-line",
  },
  khasra: {
    src: "gism-lrr-khasra-src",
    fill: "gism-lrr-khasra-fill",
    line: "gism-lrr-khasra-line",
    label: "gism-lrr-khasra-label",
  },
};

const MAUZA_DEF = {
  key: "moza",
  label: "Mauza Boundary",
  color: "#ff8b24",
  type: "polygon",
};

const LAYER_DEFS = [
  {
    key: "khasra",
    label: "Khasra Boundary",
    color: "#1f7a3a",
    type: "polygon",
    dropdown: true,
  },
  {
    key: "square",
    label: "Square Boundary",
    color: "#d7bf32",
    type: "polygon",
  },
  { key: "masawi", label: "Masawi", color: "#84cc16", type: "raster" },
];

const ALL_LAYER_DEFS = [MAUZA_DEF, ...LAYER_DEFS];

function emptyFC() {
  return { type: "FeatureCollection", features: [] };
}

function getLayerColor(key) {
  return ALL_LAYER_DEFS.find((d) => d.key === key)?.color || "#ffffff";
}

const POLYGON_STYLES = {
  moza: {
    fillColor: "#ff8b24",
    lineColor: "#ff8b24",
    fillOpacityMultiplier: 0.16,
    lineWidth: 1.5,
    labelColor: "#ff8b24",
    labelMinZoom: 14,
  },
  square: {
    fillColor: "#d7bf32",
    lineColor: "#d7bf32",
    fillOpacityMultiplier: 0.1,
    lineWidth: 1.6,
  },
  khasra: {
    fillColor: "#1f7a3a",
    lineColor: "#1f7a3a",
    fillOpacityMultiplier: 0,
    lineWidth: 1.25,
    labelColor: "#1f7a3a",
    labelMinZoom: 14.6,
  },
};

function getPolygonStyle(key, color) {
  const baseStyle = POLYGON_STYLES[key] || {
    fillColor: getLayerColor(key),
    lineColor: getLayerColor(key),
    fillOpacityMultiplier: 0.2,
    lineWidth: 1.5,
    labelColor: getLayerColor(key),
    labelMinZoom: 14,
  };

  if (!color) return baseStyle;

  return {
    ...baseStyle,
    fillColor: color,
    lineColor: color,
    labelColor: color,
  };
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
  const ids = IDS[key];
  if (!map || !ids || !geojson) return;

  const o = opacity / 100;
  const style = getPolygonStyle(key, color);

  if (!map.getSource(ids.src)) {
    map.addSource(ids.src, { type: "geojson", data: geojson });
  } else {
    map.getSource(ids.src).setData(geojson);
  }

  const beforeId = getLandRevenueBeforeId(map);

  if (!map.getLayer(ids.fill)) {
    map.addLayer(
      {
        id: ids.fill,
        type: "fill",
        source: ids.src,
        paint: {
          "fill-color": style.fillColor,
          "fill-opacity": o * style.fillOpacityMultiplier,
        },
        layout: { visibility: "visible" },
      },
      beforeId,
    );
  } else {
    map.setLayoutProperty(ids.fill, "visibility", "visible");
    map.setPaintProperty(ids.fill, "fill-color", style.fillColor);
    map.setPaintProperty(
      ids.fill,
      "fill-opacity",
      o * style.fillOpacityMultiplier,
    );
  }

  if (!map.getLayer(ids.line)) {
    map.addLayer(
      {
        id: ids.line,
        type: "line",
        source: ids.src,
        paint: {
          "line-color": style.lineColor,
          "line-width": style.lineWidth,
          "line-opacity": o,
        },
        layout: { visibility: "visible" },
      },
      beforeId,
    );
  } else {
    map.setLayoutProperty(ids.line, "visibility", "visible");
    map.setPaintProperty(ids.line, "line-color", style.lineColor);
    map.setPaintProperty(ids.line, "line-width", style.lineWidth);
    map.setPaintProperty(ids.line, "line-opacity", o);
  }

  if (ids.label && !map.getLayer(ids.label)) {
    map.addLayer(
      {
        id: ids.label,
        type: "symbol",
        source: ids.src,
        minzoom: style.labelMinZoom ?? 14,
        paint: {
          "text-color": style.labelColor || style.lineColor,
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
          "text-opacity": o,
        },
        layout: {
          visibility: "visible",
          "text-field": getLabelExpression(key),
          "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 18, 12],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
      },
      beforeId,
    );
  } else if (ids.label) {
    map.setLayoutProperty(ids.label, "visibility", "visible");
    map.setPaintProperty(
      ids.label,
      "text-color",
      style.labelColor || style.lineColor,
    );
    map.setPaintProperty(ids.label, "text-opacity", o);
  }

  reorderLandRevenueLayers(map);
}

function hideLayer(map, key) {
  if (!map) return;

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

function updateOpacity(map, key, opacity) {
  if (!map) return;

  const o = opacity / 100;

  const ids = IDS[key];
  if (!ids) return;
  const style = POLYGON_STYLES[key] || { fillOpacityMultiplier: 0.2 };

  try {
    if (map.getLayer(ids.fill))
      map.setPaintProperty(
        ids.fill,
        "fill-opacity",
        o * style.fillOpacityMultiplier,
      );
    if (map.getLayer(ids.line))
      map.setPaintProperty(ids.line, "line-opacity", o);
    if (ids.label && map.getLayer(ids.label))
      map.setPaintProperty(ids.label, "text-opacity", o);
    reorderLandRevenueLayers(map);
  } catch (_) {}
}

function updateColor(map, key, color) {
  if (!map || key === "masawi") return;

  const ids = IDS[key];
  if (!ids) return;

  try {
    if (map.getLayer(ids.fill))
      map.setPaintProperty(ids.fill, "fill-color", color);
    if (map.getLayer(ids.line))
      map.setPaintProperty(ids.line, "line-color", color);
    if (ids.label && map.getLayer(ids.label))
      map.setPaintProperty(ids.label, "text-color", color);
    reorderLandRevenueLayers(map);
  } catch (_) {}
}

async function addOrUpdateMasawiLayer(map, opacity, mauzaName, activeMasawiRef) {
  if (!map || !mauzaName) return false;

  const config = getMasawiConfigForMauza(mauzaName);

  let tileJson = null;
  try {
    const res = await fetch(config.tileJsonUrl);
    if (!res.ok) return false; // no ortho for this mauza — let caller try the next one
    tileJson = await res.json();
  } catch (e) {
    return false;
  }

  if (!tileJson?.tiles?.length) return false;

  const previous = activeMasawiRef.current;
  if (previous && previous.layerId !== config.layerId) {
    try {
      if (map.getLayer(previous.layerId)) map.removeLayer(previous.layerId);
      if (map.getSource(previous.sourceId)) map.removeSource(previous.sourceId);
    } catch (_) {}
  }

  if (!map.getSource(config.sourceId)) {
    map.addSource(config.sourceId, {
      type: "raster",
      tiles: tileJson.tiles,
      tileSize: 256,
      minzoom: tileJson.minzoom,
      maxzoom: tileJson.maxzoom,
    });
  }

  if (!map.getLayer(config.layerId)) {
    map.addLayer({
      id: config.layerId,
      type: "raster",
      source: config.sourceId,
      paint: { "raster-opacity": opacity / 100 },
      layout: { visibility: "visible" },
    });
  } else {
    map.setLayoutProperty(config.layerId, "visibility", "visible");
    map.setPaintProperty(config.layerId, "raster-opacity", opacity / 100);
  }

  activeMasawiRef.current = config;

  if (tileJson.bounds) {
    map.fitBounds(tileJson.bounds, { padding: 50, duration: 1500 });
  }

  return true;
}
export default function LandRevenueRecord({ map, selectedProjectId }) {
  const activeMasawiRef = useRef(null);
  const [mauzas, setMauzas] = useState([]);
  const [selectedMauzas, setSelectedMauzas] = useState([]);
  const [mauzaPanelOpen, setMauzaPanelOpen] = useState(false);
  const [khasraPanelOpen, setKhasraPanelOpen] = useState(false);
  const [khasraMauzas, setKhasraMauzas] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeTable, setActiveTable] = useState(null);

  const cachedData = useRef({});

  const [layers, setLayers] = useState(() =>
    Object.fromEntries(
      ALL_LAYER_DEFS.map((d) => [
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
    if (key === "masawi") {
      const current = activeMasawiRef.current;
      if (current && map?.getLayer(current.layerId)) {
        map.setPaintProperty(current.layerId, "raster-opacity", opacity / 100);
      }
    } else {
      updateOpacity(map, key, opacity);
    }
  };

  const setColor = (key, color) => {
    setLayers((prev) => ({ ...prev, [key]: { ...prev[key], color } }));
    updateColor(map, key, color);
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

    if (!selectedProjectId) {
      cachedData.current.moza = emptyFC();
      setMauzas([]);
      setSelectedMauzas([]);
      if (draw) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          emptyFC(),
          layers.moza.opacity,
          layers.moza.color,
        );
        setVisible("moza", false);
      }
      return emptyFC();
    }

    if (
      cachedData.current.mozaProjectKey === selectedProjectKey &&
      cachedData.current.moza?.features?.length
    ) {
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
      const geojson = await getProjectMauzasGeoJSON(selectedProjectId);
      console.log("Mauza GeoJSON:", geojson);
      const projectMauzas = uniqueByMauza(geojson?.features || []);
      const projectGeojson = {
        type: "FeatureCollection",
        features: projectMauzas,
      };

      cachedData.current.mozaProjectKey = selectedProjectKey;
      cachedData.current.moza = projectGeojson;

      const allProjectMauzaIds = getMauzaIdsFromFeatures(projectMauzas);
      setMauzas(projectMauzas);
      setSelectedMauzas((prev) => {
        const stillValid = prev.filter((id) => allProjectMauzaIds.includes(id));
        return stillValid.length ? stillValid : allProjectMauzaIds;
      });

      if (draw) {
        addOrUpdatePolygonLayer(
          map,
          "moza",
          projectGeojson,
          layers.moza.opacity,
          layers.moza.color,
        );
        if (zoom) fitToGeojson(map, projectGeojson);
        setVisible("moza", true);
      }

      return projectGeojson;
    } catch (error) {
      console.error("Mauza boundary load error:", error);
      return emptyFC();
    } finally {
      setLoading("moza", false);
    }
  };

const loadMauzas = async ({ zoom = false } = {}) => {
  return loadProjectMauzas({ draw: true, zoom });
};


  const loadBoundaryByMauzas = async (
    key,
    mauzaIds,
    { zoom = false, mauzaFeatures = activeMauzaFeatures } = {},
  ) => {
    if (!map || !mauzaIds?.length) {
      cachedData.current[key] = emptyFC();
      addOrUpdatePolygonLayer(
        map,
        key,
        emptyFC(),
        layers[key].opacity,
        layers[key].color,
      );
      setVisible(key, true);
      return emptyFC();
    }

    setLoading(key, true);

    try {
      const geojson =
        key === "khasra"
          ? await getKhasrasGeoJSON({ mauza_id: mauzaIds })
          : await getSquaresGeoJSON({ mauza_id: mauzaIds });

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
        const linkedMauzas = (mauzaFeatures || []).filter((feature) =>
          mauzaIds.includes(getMauzaId(feature)),
        );
        setKhasraMauzas(linkedMauzas);
        setKhasraPanelOpen("khasra");
      }

      return geojson;
    } catch (error) {
      console.error(`${key} boundary load error:`, error);
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

  const handleVisible = async (key, visible) => {
  if (!hasSelectedProject) return;

  if (!map) {
    setVisible(key, visible);
    return;
  }

  if (!visible) {
    setVisible(key, false);

    if (key === "masawi") {
      const current = activeMasawiRef.current;
      if (current && map.getLayer(current.layerId)) {
        map.setLayoutProperty(current.layerId, "visibility", "none");
      }
    } else {
      hideLayer(map, key);
    }

    if (key === "moza") {
      setMauzaPanelOpen(false);
    }

    if (key === "khasra") {
      setKhasraPanelOpen(false);
      setKhasraMauzas([]);
    }

    return;
  }

  if (key === "masawi") {
    const { features } = await ensureProjectMauzas();

    let loaded = false;
    for (const feature of features) {
      const mauzaName = getMauzaName(feature);
      // eslint-disable-next-line no-await-in-loop
      loaded = await addOrUpdateMasawiLayer(map, layers[key].opacity, mauzaName, activeMasawiRef);
      if (loaded) break;
    }

    if (!loaded) {
      console.warn("No ortho registered for any currently selected mauza.");
    }

    setVisible(key, true);
    return;
  }

  if (key === "moza") {
    await loadMauzas();
    return;
  }

  if (key === "square" || key === "khasra") {
    const { ids, features } = await ensureProjectMauzas();
    await loadBoundaryByMauzas(key, ids, {
      zoom: false,
      mauzaFeatures: features,
    });
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

    if (!layers.khasra.visible && !layers.square.visible) return;

    const reloadDependentLayers = async () => {
      if (layers.khasra.visible) {
        await loadBoundaryByMauzas("khasra", activeMauzaIds, {
          zoom: false,
          mauzaFeatures: activeMauzaFeatures,
        });
      }
      if (layers.square.visible) {
        await loadBoundaryByMauzas("square", activeMauzaIds, {
          zoom: false,
          mauzaFeatures: activeMauzaFeatures,
        });
      }
    };

    reloadDependentLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMauzaIds.join(",")]);

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

    ["moza", "square", "khasra", "masawi"].forEach((key) =>
      hideLayer(map, key),
    );

    if (activeMasawiRef.current && map.getLayer(activeMasawiRef.current.layerId)) {
      map.setLayoutProperty(activeMasawiRef.current.layerId, "visibility", "none");
    }

    setLayers((prev) => ({
      ...prev,
      moza: { ...prev.moza, visible: false, loading: false },
      square: { ...prev.square, visible: false, loading: false },
      khasra: { ...prev.khasra, visible: false, loading: false },
      masawi: { ...prev.masawi, visible: false, loading: false },
    }));
  }, [map, selectedProjectKey]);

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
        disabled={!hasSelectedProject}
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
                No {label.toLowerCase()} records loaded for selected project
                mauzas.
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

  return (
    <div className="border-b border-[#343c4c]">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-white hover:bg-[#0f3d2e]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>LAND INFORMATION SYSTEM</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="mx-3 mb-3 rounded-sm border border-[#13593f]/40 bg-[#093024] p-2">
          {!hasSelectedProject && (
            <p className="mb-2 px-1 text-[11px] text-white/40">
              Select a project to enable land revenue layers.
            </p>
          )}
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
            disabled={!hasSelectedProject}
            onChange={(checked) => handleVisible("moza", checked)}
            onOpacityChange={(opacity) => setOpacity("moza", opacity)}
            onColorChange={(value) => setColor("moza", value)}
            colorEditable
            onTableOpen={() => setActiveTable("moza")}
            onDropdownToggle={() => {
              setMauzaPanelOpen((prev) => {
                const nextOpen = !prev;
                if (nextOpen && !mauzas.length && selectedProjectId) {
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
                {!selectedProjectId && (
                  <div className="py-1 text-[11px] text-white/45">
                    Select a project first to load linked mauzas.
                  </div>
                )}

                {selectedProjectId &&
                  !layers.moza.visible &&
                  !mauzas.length &&
                  layers.moza.loading && (
                    <div className="py-1 text-[11px] text-white/45">
                      Loading linked mauza names for the selected project.
                    </div>
                  )}

                {selectedProjectId &&
                  !mauzas.length &&
                  !layers.moza.loading && (
                    <div className="py-1 text-[11px] text-white/45">
                      No mauza found for selected project.
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
                        className="accent-[#1f7a3a]"
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
