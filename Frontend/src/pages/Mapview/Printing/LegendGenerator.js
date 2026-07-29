const METAVERSE_LAYER_DEFINITIONS = [
  { scope: "layer", key: "boundary", label: "Project Boundary", kind: "line", color: "#00ff88" },
  { scope: "layer", key: "notifiedBoundary", label: "Notified Boundary", kind: "line-dash", color: "#ff2da8" },
  { scope: "layer", key: "blockBoundary", label: "Block Boundary", kind: "polygon", color: "#2563eb", fillColor: "rgba(37,99,235,.20)" },
  { scope: "layer", key: "masterPlan", label: "Master Plan", kind: "polygon", color: "#111827", fillColor: "#d9b38c" },
  { scope: "layer", key: "spotLevel", label: "Spot Levels", kind: "point", color: "#dc2626" },
  { scope: "layer", key: "contours", label: "Contours", kind: "line", color: "#a16207" },
  { scope: "layer", key: "roads", label: "Roads", kind: "line-wide", color: "#475569" },
  { scope: "layer", key: "waterSupplyPoints", label: "Water Supply Points", kind: "point", color: "#0284c7" },
  { scope: "layer", key: "waterSupplyLines", label: "Water Supply Lines", kind: "line", color: "#0ea5e9" },
  { scope: "layer", key: "sewagePoints", label: "Sewage Points", kind: "point", color: "#7c3aed" },
  { scope: "layer", key: "cameraLocations", label: "Live Camera Locations", kind: "point", color: "#ef4444" },
  { scope: "layer", key: "topography", label: "Topography", kind: "gradient", color: "#15803d" },
  { scope: "admin", key: "rudaBoundary", label: "RUDA Boundary", kind: "line", color: "#d100b8" },
  { scope: "admin", key: "rudaMauzaBoundary", label: "RUDA Mauza Boundary", kind: "polygon", color: "#f59e0b", fillColor: "rgba(245,158,11,.14)" },
  { scope: "admin", key: "rudaPhasesBoundary", label: "RUDA Phases Boundary", kind: "line", color: "#d100b8" },
  { scope: "admin", key: "geodeticNetwork", label: "Geodetic Network", kind: "point", color: "#16a34a" },
  { scope: "admin", key: "proposedRoads", label: "Proposed Roads", kind: "line-dash", color: "#f97316" },
];

const CADASTRAL_LAYER_DEFINITIONS = [
  { key: "rudaBoundary", label: "RUDA Boundary", kind: "line", color: "#22c55e" },
  { key: "proposedRoads", label: "Proposed Roads", kind: "line-wide", color: "#ef4444" },
  { key: "geodeticNetwork", label: "Geodetic Network", kind: "point", color: "#d81d1d" },
  { key: "districtBoundary", label: "District Boundary", kind: "line", color: "#f59e0b" },
  { key: "tehsilBoundary", label: "Tehsil Boundary", kind: "line", color: "#06b6d4" },
  { key: "mauzaBoundary", label: "Mauza Boundary", kind: "polygon", color: "#16a34a", fillColor: "rgba(22,163,74,.10)" },
  { key: "khasraLayer", label: "Khasra Layer", kind: "polygon", color: "#16a34a", fillColor: "rgba(22,163,74,.14)" },
  { key: "murabbaLayer", label: "Murabba Layer", kind: "polygon", color: "#facc15", fillColor: "rgba(250,204,21,.14)" },
  { key: "squareLayer", label: "Square Layer", kind: "polygon", color: "#8b5cf6", fillColor: "rgba(139,92,246,.14)" },
  { key: "acreLayer", label: "Acre Layer", kind: "polygon", color: "#14b8a6", fillColor: "rgba(20,184,166,.14)" },
  { key: "possessionLand", label: "Possession Land", kind: "polygon", color: "#5F7F00", fillColor: "rgba(95,127,0,.35)" },
  { key: "awardedLand", label: "Awarded Land", kind: "polygon", color: "#854F0B", fillColor: "#FAEEDA" },
  { key: "stateLand", label: "State Land", kind: "polygon", color: "#5F5E5A", fillColor: "#F1EFE8" },
  { key: "controlPoints", label: "Control Points", kind: "point", color: "#38bdf8" },
  { key: "triJunctionPoints", label: "Tri-Junction / Burji Points", kind: "point", color: "#e11d48" },
  { key: "fieldPoints", label: "Field Points", kind: "point", color: "#2563eb" },
  { key: "mussaviLayer", label: "Mussavi / Orthophoto", kind: "raster", color: "#64748b" },
];

const getLayerState = (layers, key) => {
  if (key === "mussaviLayer") {
    return layers?.mussaviLayer ?? layers?.handuGujranOrtho;
  }
  return layers?.[key];
};

export const isLayerStateVisible = (state) =>
  typeof state === "object" && state !== null
    ? Boolean(state.visible)
    : Boolean(state);

const isMapLayerVisible = (map, layerId) => {
  if (!map?.getLayer?.(layerId)) return false;
  return map.getLayoutProperty(layerId, "visibility") !== "none";
};

export const buildVisibleLegendRows = ({
  map,
  layerVisibility = {},
  adminBoundaryVisibility = {},
  includeImportedLayer = true,
}) => {
  const rows = METAVERSE_LAYER_DEFINITIONS.filter((definition) => {
    const source = definition.scope === "admin" ? adminBoundaryVisibility : layerVisibility;
    return Boolean(source?.[definition.key]);
  }).map((definition) => ({ ...definition, id: definition.key }));

  if (
    includeImportedLayer &&
    ["user-imported-fill", "user-imported-outline", "user-imported-line", "user-imported-point"].some(
      (layerId) => isMapLayerVisible(map, layerId),
    )
  ) {
    rows.push({
      id: "user-imported-data",
      label: "Imported KMZ",
      kind: "polygon",
      color: "#facc15",
      fillColor: "rgba(209,213,219,.42)",
    });
  }

  return rows;
};

export const buildCadastralLegendRows = ({ layers = {}, boundaryStatus = "verified" }) =>
  CADASTRAL_LAYER_DEFINITIONS.filter(({ key }) =>
    isLayerStateVisible(getLayerState(layers, key)),
  ).map((definition) => {
    const state = getLayerState(layers, definition.key);
    const stateColor =
      typeof state === "object" && state?.color ? state.color : undefined;

    const statusColor =
      ["mauzaBoundary", "khasraLayer"].includes(definition.key)
        ? boundaryStatus === "unverified"
          ? "#dc5a5a"
          : "#16a34a"
        : undefined;

    return {
      ...definition,
      id: definition.key,
      color: statusColor || stateColor || definition.color,
    };
  });
