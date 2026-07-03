import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

const MASTER_PLAN_FILL_COLOR = [
  "case",

  // Residential plots - light blue like your reference image
  [
    ">=",
    [
      "index-of",
      "residential",
      [
        "downcase",
        [
          "to-string",
          [
            "coalesce",
            ["get", "type"],
            ["get", "land_use"],
            ["get", "landuse"],
            "",
          ],
        ],
      ],
    ],
    0,
  ],
  "#2563eb",

  // Commercial plots - yellow
  [
    ">=",
    [
      "index-of",
      "commercial",
      [
        "downcase",
        [
          "to-string",
          [
            "coalesce",
            ["get", "type"],
            ["get", "land_use"],
            ["get", "landuse"],
            "",
          ],
        ],
      ],
    ],
    0,
  ],
  "#f6dc78",

  // Parks / open spaces - green
  [
    "any",
    [
      ">=",
      [
        "index-of",
        "park",
        [
          "downcase",
          [
            "to-string",
            [
              "coalesce",
              ["get", "type"],
              ["get", "land_use"],
              ["get", "landuse"],
              "",
            ],
          ],
        ],
      ],
      0,
    ],
    [
      ">=",
      [
        "index-of",
        "green",
        [
          "downcase",
          [
            "to-string",
            [
              "coalesce",
              ["get", "type"],
              ["get", "land_use"],
              ["get", "landuse"],
              "",
            ],
          ],
        ],
      ],
      0,
    ],
    [
      ">=",
      [
        "index-of",
        "open",
        [
          "downcase",
          [
            "to-string",
            [
              "coalesce",
              ["get", "type"],
              ["get", "land_use"],
              ["get", "landuse"],
              "",
            ],
          ],
        ],
      ],
      0,
    ],
  ],
  "#15803d",

  // Roads inside master plan - soft red/pink, separate roads layer can still be unchecked
  [
    ">=",
    [
      "index-of",
      "road",
      [
        "downcase",
        [
          "to-string",
          [
            "coalesce",
            ["get", "type"],
            ["get", "land_use"],
            ["get", "landuse"],
            "",
          ],
        ],
      ],
    ],
    0,
  ],
  "#ef4444",

  // Other / public / unknown plots - grey
  "#9ca3af",
];

export function addMasterPlanLayer(map, data, color = null) {
  ensureSource(map, SOURCES.masterPlan, data);

  if (!map.getLayer(LAYERS.masterPlanFill)) {
    map.addLayer({
      id: LAYERS.masterPlanFill,
      type: "fill",
      source: SOURCES.masterPlan,
      paint: {
        "fill-color": MASTER_PLAN_FILL_COLOR,
        "fill-opacity": 0.45,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.masterPlanFill,
      "fill-color",
      MASTER_PLAN_FILL_COLOR,
    );
    map.setPaintProperty(LAYERS.masterPlanFill, "fill-opacity", 0.45);
  }

  if (!map.getLayer(LAYERS.masterPlanLine)) {
    map.addLayer({
      id: LAYERS.masterPlanLine,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": "#111111",
        "line-width": 1.15,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.masterPlanLine, "line-color", "#111111");
    map.setPaintProperty(LAYERS.masterPlanLine, "line-width", 1.15);
  }

  if (!map.getLayer(LAYERS.masterPlanLabel)) {
    map.addLayer({
      id: LAYERS.masterPlanLabel,
      type: "symbol",
      source: SOURCES.masterPlan,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "plot_no"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 16, 10, 18, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": color || "#111111",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.masterPlanLabel,
      "text-color",
      color || "#111111",
    );
  }

  if (!map.getLayer(LAYERS.masterPlanHover)) {
    map.addLayer({
      id: LAYERS.masterPlanHover,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": "#ffffff",
        "line-width": 4,
        "line-opacity": 0,
      },
      filter: ["==", ["to-string", ["get", "gid"]], "__none__"],
    });
  }
}
