const LAYER_DEFINITIONS = [
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
  const rows = LAYER_DEFINITIONS.filter((definition) => {
    const source =
      definition.scope === "admin"
        ? adminBoundaryVisibility
        : layerVisibility;
    return Boolean(source?.[definition.key]);
  }).map((definition) => ({ ...definition, id: definition.key }));

  if (
    includeImportedLayer &&
    [
      "user-imported-fill",
      "user-imported-outline",
      "user-imported-line",
      "user-imported-point",
    ].some((layerId) => isMapLayerVisible(map, layerId))
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
