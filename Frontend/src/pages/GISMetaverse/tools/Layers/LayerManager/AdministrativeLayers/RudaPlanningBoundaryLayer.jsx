const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const RUDA_PLANNING_BOUNDARY = {
  label: "RUDA Phases Boundary",
  endpoint: "/ruda/",
  source: "metaverse-admin-ruda-phases-source",
  fill: "metaverse-admin-ruda-phases-fill",
  line: "metaverse-admin-ruda-phases-line",
  labelLayer: "metaverse-admin-ruda-phases-label",
};

export const RUDA_PHASE_LEGEND = [
  { label: "Phase 2B", color: "#F4B942" },
  { label: "Phase 1", color: "#41b111ff" },
  { label: "Phase 3", color: "#E76F51" },
  { label: "Phase 2A", color: "#4F7CAC" },
  { label: "Jhok Forest", color: "#14db63ff" },
];

export const DEFAULT_RUDA_PLANNING_STYLE = {
  color: "#334155",
  fillColor: "#F4B942",
  opacity: 100,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const PHASE_NAME_EXPRESSION = [
  "coalesce",
  ["get", "phase_name"],
  ["get", "phase"],
  ["get", "phase_no"],
  ["get", "phase_no_"],
  ["get", "name"],
  ["get", "Name"],
  ["get", "name_"],
  ["get", "project_name"],
  ["get", "project"],
  ["get", "title"],
  ["get", "label"],
  ["get", "remarks"],
  "",
];

const NORMALIZED_PHASE_EXPRESSION = [
  "downcase",
  ["to-string", PHASE_NAME_EXPRESSION],
];

const PHASE_FILL_EXPRESSION = [
  "case",
  [
    "in",
    NORMALIZED_PHASE_EXPRESSION,
    ["literal", ["phase 2b", "phase2b", "2b", "phase-2b"]],
  ],
  "#F4B942",
  [
    "in",
    NORMALIZED_PHASE_EXPRESSION,
    ["literal", ["phase 1", "phase1", "1", "phase-1"]],
  ],
  "#2FA36B",
  [
    "in",
    NORMALIZED_PHASE_EXPRESSION,
    ["literal", ["phase 3", "phase3", "3", "phase-3"]],
  ],
  "#E76F51",
  [
    "in",
    NORMALIZED_PHASE_EXPRESSION,
    ["literal", ["phase 2a", "phase2a", "2a", "phase-2a"]],
  ],
  "#4F7CAC",
  [
    "in",
    NORMALIZED_PHASE_EXPRESSION,
    [
      "literal",
      ["jhok forest", "jhokforest", "jhok", "forest", "jhok-forest"],
    ],
  ],
  "#1F7A5A",
  "#CBD5E1",
];

export function setRudaPlanningBoundaryVisibility(map, visible) {
  [
    RUDA_PLANNING_BOUNDARY.fill,
    RUDA_PLANNING_BOUNDARY.line,
    RUDA_PLANNING_BOUNDARY.labelLayer,
  ].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

export function addOrUpdateRudaPlanningBoundary(
  map,
  geojson,
  style = DEFAULT_RUDA_PLANNING_STYLE,
) {
  if (!map) return;

  const hasGeoJSON = geojson?.type === "FeatureCollection";
  const data = hasGeoJSON ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;

  if (!map.getSource(RUDA_PLANNING_BOUNDARY.source)) {
    map.addSource(RUDA_PLANNING_BOUNDARY.source, {
      type: "geojson",
      data,
    });
  } else if (hasGeoJSON) {
    map.getSource(RUDA_PLANNING_BOUNDARY.source).setData(data);
  }

  if (!map.getLayer(RUDA_PLANNING_BOUNDARY.fill)) {
    map.addLayer({
      id: RUDA_PLANNING_BOUNDARY.fill,
      type: "fill",
      source: RUDA_PLANNING_BOUNDARY.source,
      filter: [
        "match",
        ["geometry-type"],
        ["Polygon", "MultiPolygon"],
        true,
        false,
      ],
      paint: {
        "fill-color": PHASE_FILL_EXPRESSION,
        "fill-opacity": 0.72 * opacity,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setPaintProperty(
      RUDA_PLANNING_BOUNDARY.fill,
      "fill-color",
      PHASE_FILL_EXPRESSION,
    );
    map.setPaintProperty(
      RUDA_PLANNING_BOUNDARY.fill,
      "fill-opacity",
      0.72 * opacity,
    );
    map.setLayoutProperty(
      RUDA_PLANNING_BOUNDARY.fill,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(RUDA_PLANNING_BOUNDARY.line)) {
    map.addLayer({
      id: RUDA_PLANNING_BOUNDARY.line,
      type: "line",
      source: RUDA_PLANNING_BOUNDARY.source,
      paint: {
        "line-color": style.color || "#334155",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          1,
          10,
          1.6,
          14,
          2.2,
        ],
        "line-opacity": opacity,
      },
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
    });
  } else {
    map.setPaintProperty(
      RUDA_PLANNING_BOUNDARY.line,
      "line-color",
      style.color || "#334155",
    );
    map.setPaintProperty(
      RUDA_PLANNING_BOUNDARY.line,
      "line-opacity",
      opacity,
    );
    map.setLayoutProperty(
      RUDA_PLANNING_BOUNDARY.line,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(RUDA_PLANNING_BOUNDARY.labelLayer)) {
    map.addLayer({
      id: RUDA_PLANNING_BOUNDARY.labelLayer,
      type: "symbol",
      source: RUDA_PLANNING_BOUNDARY.source,
      minzoom: 6,
      layout: {
        visibility: "visible",
        "symbol-placement": "point",
        "text-field": ["to-string", PHASE_NAME_EXPRESSION],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          10,
          10,
          13,
          14,
          16,
        ],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-max-width": 10,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#172033",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.5,
        "text-halo-blur": 0.25,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setLayoutProperty(
      RUDA_PLANNING_BOUNDARY.labelLayer,
      "text-field",
      ["to-string", PHASE_NAME_EXPRESSION],
    );
    map.setPaintProperty(
      RUDA_PLANNING_BOUNDARY.labelLayer,
      "text-opacity",
      opacity,
    );
    map.setLayoutProperty(
      RUDA_PLANNING_BOUNDARY.labelLayer,
      "visibility",
      "visible",
    );
  }
}