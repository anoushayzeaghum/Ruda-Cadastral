const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const NOTIFIED_PHASES_BOUNDARY = {
  label: "RUDA Phases Boundary",
  endpoint: "/ruda-notified-phases-boundary/",
  source: "metaverse-admin-notified-phases-source",
  fill: "metaverse-admin-notified-phases-fill",
  line: "metaverse-admin-notified-phases-line",
  labelLayer: "metaverse-admin-notified-phases-label",
};

export const NOTIFIED_PHASES_LEGEND = [
  { label: "Phase 1", color: "#6BD69A" },
  { label: "Phase 2A", color: "#B99CF3" },
  { label: "Phase 2B", color: "#F8D56B" },
  { label: "Phase 3", color: "#F59E72" },
];

export const DEFAULT_NOTIFIED_PHASES_STYLE = {
  color: "#465568",
  fillColor: "#F8D56B",
  opacity: 100,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const PHASE_NAME_EXPRESSION = [
  "coalesce",
  ["get", "phases_new"],
  ["get", "phases"],
  ["get", "phase_name"],
  ["get", "phase"],
  ["get", "name"],
  "",
];

const NORMALIZED_PHASE_EXPRESSION = [
  "downcase",
  ["to-string", PHASE_NAME_EXPRESSION],
];

const containsPhaseText = (text) => [
  "!=",
  ["index-of", text, NORMALIZED_PHASE_EXPRESSION],
  -1,
];

const PHASE_FILL_EXPRESSION = [
  "case",
  containsPhaseText("2b"),
  "#F8D56B",
  containsPhaseText("2a"),
  "#B99CF3",
  containsPhaseText("phase 3"),
  "#F59E72",
  containsPhaseText("phase - 3"),
  "#F59E72",
  containsPhaseText("phase 1"),
  "#6BD69A",
  containsPhaseText("phase - 1"),
  "#6BD69A",
  "#D9E2EC",
];

export function setNotifiedPhasesBoundaryVisibility(map, visible) {
  [
    NOTIFIED_PHASES_BOUNDARY.fill,
    NOTIFIED_PHASES_BOUNDARY.line,
    NOTIFIED_PHASES_BOUNDARY.labelLayer,
  ].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

export function addOrUpdateNotifiedPhasesBoundary(
  map,
  geojson,
  style = DEFAULT_NOTIFIED_PHASES_STYLE,
) {
  if (!map) return;

  const hasGeoJSON = geojson?.type === "FeatureCollection";
  const data = hasGeoJSON ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;

  if (!map.getSource(NOTIFIED_PHASES_BOUNDARY.source)) {
    map.addSource(NOTIFIED_PHASES_BOUNDARY.source, {
      type: "geojson",
      data,
    });
  } else if (hasGeoJSON) {
    map.getSource(NOTIFIED_PHASES_BOUNDARY.source)?.setData?.(data);
  }

  if (!map.getLayer(NOTIFIED_PHASES_BOUNDARY.fill)) {
    map.addLayer({
      id: NOTIFIED_PHASES_BOUNDARY.fill,
      type: "fill",
      source: NOTIFIED_PHASES_BOUNDARY.source,
      filter: [
        "match",
        ["geometry-type"],
        ["Polygon", "MultiPolygon"],
        true,
        false,
      ],
      layout: { visibility: "visible" },
      paint: {
        "fill-color": PHASE_FILL_EXPRESSION,
        "fill-opacity": 0.68 * opacity,
      },
    });
  } else {
    map.setPaintProperty(
      NOTIFIED_PHASES_BOUNDARY.fill,
      "fill-color",
      PHASE_FILL_EXPRESSION,
    );
    map.setPaintProperty(
      NOTIFIED_PHASES_BOUNDARY.fill,
      "fill-opacity",
      0.68 * opacity,
    );
    map.setLayoutProperty(
      NOTIFIED_PHASES_BOUNDARY.fill,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(NOTIFIED_PHASES_BOUNDARY.line)) {
    map.addLayer({
      id: NOTIFIED_PHASES_BOUNDARY.line,
      type: "line",
      source: NOTIFIED_PHASES_BOUNDARY.source,
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": style.color || DEFAULT_NOTIFIED_PHASES_STYLE.color,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          1,
          10,
          1.7,
          14,
          2.4,
        ],
        "line-opacity": opacity,
      },
    });
  } else {
    map.setPaintProperty(
      NOTIFIED_PHASES_BOUNDARY.line,
      "line-color",
      style.color || DEFAULT_NOTIFIED_PHASES_STYLE.color,
    );
    map.setPaintProperty(
      NOTIFIED_PHASES_BOUNDARY.line,
      "line-opacity",
      opacity,
    );
    map.setLayoutProperty(
      NOTIFIED_PHASES_BOUNDARY.line,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(NOTIFIED_PHASES_BOUNDARY.labelLayer)) {
    map.addLayer({
      id: NOTIFIED_PHASES_BOUNDARY.labelLayer,
      type: "symbol",
      source: NOTIFIED_PHASES_BOUNDARY.source,
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
        "text-color": "#25313C",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.5,
        "text-halo-blur": 0.25,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setLayoutProperty(
      NOTIFIED_PHASES_BOUNDARY.labelLayer,
      "text-field",
      ["to-string", PHASE_NAME_EXPRESSION],
    );
    map.setPaintProperty(
      NOTIFIED_PHASES_BOUNDARY.labelLayer,
      "text-opacity",
      opacity,
    );
    map.setLayoutProperty(
      NOTIFIED_PHASES_BOUNDARY.labelLayer,
      "visibility",
      "visible",
    );
  }
}
