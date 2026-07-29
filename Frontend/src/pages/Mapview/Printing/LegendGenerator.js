const METAVERSE_LAYER_DEFINITIONS = [
  { scope: "layer", key: "boundary", label: "Project Boundary", kind: "line", color: "#00ff88", patterns: ["project-boundary", "boundary-line", "boundary-fill"] },
  { scope: "layer", key: "notifiedBoundary", label: "Notified Boundary", kind: "line-dash", color: "#ff2da8", patterns: ["notified-boundary"] },
  { scope: "layer", key: "blockBoundary", label: "Block Boundary", kind: "polygon", color: "#2563eb", fillColor: "rgba(37,99,235,.18)", patterns: ["block-fill", "block-line", "block-label"] },
  { scope: "layer", key: "masterPlan", label: "Master Plan", kind: "polygon", color: "#111827", fillColor: "#d9b38c", patterns: ["master-plan", "masterplan"] },
  { scope: "layer", key: "spotLevel", label: "Spot Levels", kind: "point", color: "#dc2626", patterns: ["spot-level", "spotlevel"] },
  { scope: "layer", key: "contours", label: "Contours", kind: "line", color: "#a16207", patterns: ["contour"] },
  { scope: "layer", key: "roads", label: "Roads", kind: "line-wide", color: "#475569", patterns: ["roads-fill", "roads-line", "road-fill", "road-line"] },
  { scope: "layer", key: "waterSupplyPoints", label: "Water Supply Points", kind: "point", color: "#0284c7", patterns: ["water-supply-point"] },
  { scope: "layer", key: "waterSupplyLines", label: "Water Supply Lines", kind: "line", color: "#0ea5e9", patterns: ["water-supply-line"] },
  { scope: "layer", key: "sewagePoints", label: "Sewage Points", kind: "point", color: "#7c3aed", patterns: ["sewage-point"] },
  { scope: "layer", key: "cameraLocations", label: "Live Camera Locations", kind: "point", color: "#ef4444", patterns: ["camera-location"] },
  { scope: "layer", key: "topography", label: "Topography", kind: "gradient", color: "#15803d", patterns: ["topograph", "terrain", "dem", "dsm", "dtm"] },
  { scope: "admin", key: "rudaBoundary", label: "RUDA Boundary", kind: "line", color: "#d100b8", patterns: ["ruda-boundary"], excludes: ["mauza", "phase", "notified"] },
  { scope: "admin", key: "rudaMauzaBoundary", label: "RUDA Mauza Boundary", kind: "polygon", color: "#f59e0b", fillColor: "rgba(245,158,11,.14)", patterns: ["ruda-mauza", "mauza-boundary"] },
  { scope: "admin", key: "rudaPhasesBoundary", label: "RUDA Phases Boundary", kind: "polygon", color: "#111827", fillColor: "rgba(99,102,241,.20)", patterns: ["notified-phase", "notified_phases", "notified-phases", "ruda-phase", "phase-boundary", "phases-boundary"] },
  { scope: "admin", key: "geodeticNetwork", label: "Geodetic Network", kind: "point", color: "#16a34a", patterns: ["geodetic"] },
  { scope: "admin", key: "proposedRoads", label: "Proposed Roads", kind: "line-dash", color: "#f97316", patterns: ["proposed-road"] },
];

const CADASTRAL_LAYER_DEFINITIONS = [
  { key: "rudaBoundary", label: "RUDA Boundary", kind: "line", color: "#22c55e", patterns: ["ruda-"] },
  { key: "proposedRoads", label: "Proposed Roads", kind: "line-wide", color: "#ef4444", patterns: ["proposed-road"] },
  { key: "geodeticNetwork", label: "Geodetic Network", kind: "point", color: "#d81d1d", patterns: ["geodetic"] },
  { key: "districtBoundary", label: "District Boundary", kind: "line", color: "#f59e0b", patterns: ["district"] },
  { key: "tehsilBoundary", label: "Tehsil Boundary", kind: "line", color: "#06b6d4", patterns: ["tehsil"] },
  { key: "mauzaBoundary", label: "Mauza Boundary", kind: "polygon", color: "#16a34a", fillColor: "rgba(22,163,74,.10)", patterns: ["mauza"] },
  { key: "khasraLayer", label: "Khasra Parcels", kind: "polygon", color: "#16a34a", fillColor: "rgba(22,163,74,.14)", patterns: ["khasra"] },
  { key: "murabbaLayer", label: "Murabba Boundary", kind: "polygon", color: "#facc15", fillColor: "rgba(250,204,21,.14)", patterns: ["murabba"] },
  { key: "squareLayer", label: "Square Boundary", kind: "polygon", color: "#8b5cf6", fillColor: "rgba(139,92,246,.14)", patterns: ["square"] },
  { key: "acreLayer", label: "Acre Boundary", kind: "polygon", color: "#14b8a6", fillColor: "rgba(20,184,166,.14)", patterns: ["acre"] },
  { key: "possessionLand", label: "Possession Land", kind: "polygon", color: "#5F7F00", fillColor: "rgba(95,127,0,.35)", patterns: ["possession"] },
  { key: "awardedLand", label: "Awarded Land", kind: "polygon", color: "#854F0B", fillColor: "#FAEEDA", patterns: ["awarded"] },
  { key: "stateLand", label: "State Land", kind: "polygon", color: "#5F5E5A", fillColor: "#F1EFE8", patterns: ["state-land", "stateland"] },
  { key: "controlPoints", label: "Control Points", kind: "point", color: "#38bdf8", patterns: ["control-point"] },
  { key: "triJunctionPoints", label: "Tri-Junction / Burji Points", kind: "point", color: "#e11d48", patterns: ["tri-junction", "trijunction", "burji"] },
  { key: "fieldPoints", label: "Field Points", kind: "point", color: "#2563eb", patterns: ["field-point"] },
  { key: "mussaviLayer", label: "Mussavi / Orthophoto", kind: "raster", color: "#64748b", patterns: ["mussavi", "massavi", "ortho"] },
];

const BASEMAP_LAYER_PREFIXES = [
  "background", "land", "water", "road", "bridge", "tunnel", "building",
  "place", "poi", "admin", "transit", "airport", "natural", "hillshade",
];

const normalize = (value) => String(value || "").trim().toLowerCase();

const getLayerState = (layers, key) => {
  if (key === "mussaviLayer") {
    return layers?.mussaviLayer ?? layers?.handuGujranOrtho;
  }
  return layers?.[key];
};

export const isLayerStateVisible = (state) => {
  if (state === null || state === undefined) return false;
  if (typeof state === "object") return Boolean(state.visible);
  return Boolean(state);
};

const isMapLayerVisible = (map, layerId) => {
  if (!map?.getLayer?.(layerId)) return false;
  try {
    return map.getLayoutProperty(layerId, "visibility") !== "none";
  } catch {
    return true;
  }
};

const getVisibleStyleLayers = (map) => {
  const styleLayers = map?.getStyle?.()?.layers;
  if (!Array.isArray(styleLayers)) return [];

  return styleLayers.filter(
    (layer) => layer?.id && isMapLayerVisible(map, layer.id),
  );
};

const matchesDefinition = (layer, definition) => {
  const id = normalize(layer?.id);
  const patterns = (definition.patterns || []).map(normalize);
  const excludes = (definition.excludes || []).map(normalize);

  const included = patterns.some((pattern) => id.includes(pattern));
  const excluded = excludes.some((pattern) => id.includes(pattern));

  return included && !excluded;
};

const getPaintValue = (map, layerId, property, fallback) => {
  try {
    const value = map.getPaintProperty(layerId, property);
    return typeof value === "string" ? value : fallback;
  } catch {
    return fallback;
  }
};

const deriveStyleFromMapLayer = (map, layer, fallback = {}) => {
  const type = layer?.type;

  if (type === "circle" || type === "symbol") {
    return {
      kind: "point",
      color:
        getPaintValue(map, layer.id, "circle-color", null) ||
        getPaintValue(map, layer.id, "text-color", null) ||
        fallback.color ||
        "#2563eb",
    };
  }

  if (type === "fill") {
    return {
      kind: "polygon",
      color:
        getPaintValue(map, layer.id, "fill-outline-color", null) ||
        fallback.color ||
        "#111827",
      fillColor:
        getPaintValue(map, layer.id, "fill-color", null) ||
        fallback.fillColor ||
        "rgba(148,163,184,.25)",
    };
  }

  if (type === "raster") {
    return {
      kind: "raster",
      color: fallback.color || "#64748b",
    };
  }

  return {
    kind: "line",
    color:
      getPaintValue(map, layer.id, "line-color", null) ||
      fallback.color ||
      "#111827",
  };
};

const dedupeRows = (rows) => {
  const seen = new Set();
  return rows.filter((row) => {
    const id = row.id || row.key || row.label;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const titleFromLayerId = (layerId) =>
  String(layerId || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(fill|line|label|circle|symbol|outline|layer|source)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const isLikelyOperationalLayer = (layer) => {
  const id = normalize(layer?.id);
  if (!id) return false;

  const source = normalize(layer?.source);
  const isBasemapSource = ["composite", "mapbox", "streets"].includes(source);
  const hasBasemapPrefix = BASEMAP_LAYER_PREFIXES.some((prefix) =>
    id.startsWith(prefix),
  );

  return !isBasemapSource && !hasBasemapPrefix;
};

const buildGenericVisibleRows = (map, knownRows) => {
  const knownIds = new Set(knownRows.map((row) => row.matchedLayerId).filter(Boolean));

  return getVisibleStyleLayers(map)
    .filter(isLikelyOperationalLayer)
    .filter((layer) => !knownIds.has(layer.id))
    .map((layer) => {
      const style = deriveStyleFromMapLayer(map, layer);
      return {
        id: `map-layer:${layer.id}`,
        label: titleFromLayerId(layer.id) || "Visible Operational Layer",
        matchedLayerId: layer.id,
        ...style,
      };
    });
};

const buildRowsFromDefinitions = ({
  map,
  definitions,
  stateResolver,
}) => {
  const visibleMapLayers = getVisibleStyleLayers(map);

  const knownRows = definitions
    .filter((definition) => {
      const state = stateResolver(definition);
      const visibleInState = isLayerStateVisible(state);
      const visibleLayer = visibleMapLayers.find((layer) =>
        matchesDefinition(layer, definition),
      );

      return visibleInState || Boolean(visibleLayer);
    })
    .map((definition) => {
      const state = stateResolver(definition);
      const visibleLayer = visibleMapLayers.find((layer) =>
        matchesDefinition(layer, definition),
      );

      const stateColor =
        typeof state === "object" && state?.color
          ? state.color
          : undefined;

      const mapStyle = visibleLayer
        ? deriveStyleFromMapLayer(map, visibleLayer, definition)
        : {};

      return {
        ...definition,
        id: definition.key,
        matchedLayerId: visibleLayer?.id,
        color: stateColor || mapStyle.color || definition.color,
        fillColor: mapStyle.fillColor || definition.fillColor,
        kind: mapStyle.kind || definition.kind,
      };
    });

  // Generic fallback guarantees that a visible custom Mapbox layer never
  // leaves the legend empty merely because its ID differs from a known pattern.
  return dedupeRows([
    ...knownRows,
    ...buildGenericVisibleRows(map, knownRows),
  ]);
};

export const buildVisibleLegendRows = ({
  map,
  layerVisibility = {},
  adminBoundaryVisibility = {},
  includeImportedLayer = true,
}) => {
  const rows = buildRowsFromDefinitions({
    map,
    definitions: METAVERSE_LAYER_DEFINITIONS,
    stateResolver: (definition) =>
      definition.scope === "admin"
        ? adminBoundaryVisibility?.[definition.key]
        : layerVisibility?.[definition.key],
  });

  if (
    includeImportedLayer &&
    [
      "user-imported-fill",
      "user-imported-outline",
      "user-imported-line",
      "user-imported-point",
    ].some((id) => isMapLayerVisible(map, id))
  ) {
    rows.push({
      id: "user-imported-data",
      label: "Imported KMZ",
      kind: "polygon",
      color: "#facc15",
      fillColor: "rgba(209,213,219,.42)",
    });
  }

  return dedupeRows(rows);
};

export const buildCadastralLegendRows = ({
  map,
  layers = {},
  boundaryStatus = "verified",
}) => {
  const rows = buildRowsFromDefinitions({
    map,
    definitions: CADASTRAL_LAYER_DEFINITIONS,
    stateResolver: (definition) =>
      getLayerState(layers, definition.key),
  });

  return rows.map((row) => {
    const statusColor =
      ["mauzaBoundary", "khasraLayer"].includes(row.key)
        ? boundaryStatus === "unverified"
          ? "#dc5a5a"
          : "#16a34a"
        : undefined;

    return {
      ...row,
      color: statusColor || row.color,
    };
  });
};
