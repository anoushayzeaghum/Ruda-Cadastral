import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

const BLOCK_COLORS = [
  "#7c3aed",
  "#0f3d2e",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#0891b2",
  "#db2777",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#0ea5e9",
];

const blockNameExpression = [
  "to-string",
  ["coalesce", ["get", "block"], ["get", "name"], ""],
];

const blockKeyExpression = ["downcase", blockNameExpression];

function buildBlockColorExpression(data) {
  const blockNames = Array.from(
    new Set(
      (data?.features || [])
        .map(
          (feature) => feature?.properties?.block || feature?.properties?.name,
        )
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    ),
  );

  const matchItems = blockNames.flatMap((blockName, index) => [
    blockName,
    BLOCK_COLORS[index % BLOCK_COLORS.length],
  ]);

  return ["match", blockKeyExpression, ...matchItems, "#9ca3af"];
}

export function addBlockLayer(map, data) {
  ensureSource(map, SOURCES.block, data);

  const blockColorExpression = buildBlockColorExpression(data);

  if (!map.getLayer(LAYERS.blockFill)) {
    map.addLayer({
      id: LAYERS.blockFill,
      type: "fill",
      source: SOURCES.block,
      paint: {
        "fill-color": blockColorExpression,
        "fill-opacity": 0.28,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.blockFill, "fill-color", blockColorExpression);
  }

  if (!map.getLayer(LAYERS.blockLine)) {
    map.addLayer({
      id: LAYERS.blockLine,
      type: "line",
      source: SOURCES.block,
      paint: {
        "line-color": blockColorExpression,
        "line-width": 2.5,
        "line-opacity": 1,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.blockLine, "line-color", blockColorExpression);
  }

  if (!map.getLayer(LAYERS.blockLabel)) {
    map.addLayer({
      id: LAYERS.blockLabel,
      type: "symbol",
      source: SOURCES.block,
      minzoom: 14,
      layout: {
        "text-field": blockNameExpression,
        "text-size": ["interpolate", ["linear"], ["zoom"], 14, 11, 18, 16],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#06291f",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.7,
        "text-opacity": 1,
      },
    });
  } else {
    map.setLayoutProperty(LAYERS.blockLabel, "text-field", blockNameExpression);
  }
}
