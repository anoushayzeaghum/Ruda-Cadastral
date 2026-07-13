import { SOURCES, LAYERS, ensureSource } from "../MetaverseLayerConfig";

export function addRoadLayer(map, data) {
  ensureSource(map, SOURCES.roads, data);

  const roadTypeExpression = [
    "downcase",
    [
      "to-string",
      ["coalesce", ["get", "type"], ["get", "Type"], ["get", "TYPE"], ""],
    ],
  ];

  const roadFillColorExpression = [
    "match",
    roadTypeExpression,
    "street",
    "#ef4444",
    "secondary road",
    "#dc2626",
    "primary road",
    "#991b1b",
    "#d01f1f",
  ];

  const roadLineColorExpression = [
    "match",
    roadTypeExpression,
    "street",
    "#dc2626",
    "secondary road",
    "#b91c1c",
    "primary road",
    "#7f1d1d",
    "#991b1b",
  ];

  const roadLineWidthExpression = [
    "match",
    roadTypeExpression,
    "street",
    1.2,
    "secondary road",
    1.7,
    "primary road",
    2.2,
    1.5,
  ];

  if (!map.getLayer(LAYERS.roadsFill)) {
    map.addLayer({
      id: LAYERS.roadsFill,
      type: "fill",
      source: SOURCES.roads,
      paint: {
        "fill-color": roadFillColorExpression,
        "fill-opacity": 0.35,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.roadsFill,
      "fill-color",
      roadFillColorExpression,
    );
  }

  if (!map.getLayer(LAYERS.roadsLine)) {
    map.addLayer({
      id: LAYERS.roadsLine,
      type: "line",
      source: SOURCES.roads,
      paint: {
        "line-color": roadLineColorExpression,
        "line-width": roadLineWidthExpression,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.roadsLine,
      "line-color",
      roadLineColorExpression,
    );
    map.setPaintProperty(
      LAYERS.roadsLine,
      "line-width",
      roadLineWidthExpression,
    );
  }
}
