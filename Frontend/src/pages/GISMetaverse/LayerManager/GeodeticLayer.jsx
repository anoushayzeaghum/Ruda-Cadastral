import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

const GEODETIC_POINT_COLOR = "#1d4ed8";
const GEODETIC_POINT_STROKE = "#dbeafe";
const GEODETIC_LABEL_COLOR = "#0f2f5f";

const GEODETIC_LABEL_FIELD = [
  "to-string",
  [
    "coalesce",
    ["get", "name"],
    ["get", "Name"],
    ["get", "NAME"],
    ["get", "code"],
    ["get", "Code"],
    ["get", "CODE"],
    "",
  ],
];

const setPaintProperties = (map, layerId, paint = {}) => {
  if (!map.getLayer(layerId)) return;

  Object.entries(paint).forEach(([property, value]) => {
    map.setPaintProperty(layerId, property, value);
  });
};

const setLayoutProperties = (map, layerId, layout = {}) => {
  if (!map.getLayer(layerId)) return;

  Object.entries(layout).forEach(([property, value]) => {
    map.setLayoutProperty(layerId, property, value);
  });
};

export function addGeodeticNetworkLayer(
  map,
  data,
  color = GEODETIC_POINT_COLOR,
) {
  ensureSource(map, SOURCES.geodeticNetwork, data);

  const circlePaint = {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 14, 6, 17, 8],
    "circle-color": color,
    "circle-stroke-color": GEODETIC_POINT_STROKE,
    "circle-stroke-width": 1.5,
  };

  const labelLayout = {
    "text-field": GEODETIC_LABEL_FIELD,
    "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 16, 12],
    "text-offset": [0, 1.25],
    "text-anchor": "top",
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-allow-overlap": true,
    "text-ignore-placement": true,
    "text-optional": true,
  };

  const labelPaint = {
    "text-color": color,
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.4,
    "text-halo-blur": 0.2,
  };

  if (!map.getLayer(LAYERS.geodeticNetworkCircle)) {
    map.addLayer({
      id: LAYERS.geodeticNetworkCircle,
      type: "circle",
      source: SOURCES.geodeticNetwork,
      paint: circlePaint,
    });
  } else {
    setPaintProperties(map, LAYERS.geodeticNetworkCircle, circlePaint);
  }

  if (!map.getLayer(LAYERS.geodeticNetworkLabel)) {
    map.addLayer({
      id: LAYERS.geodeticNetworkLabel,
      type: "symbol",
      source: SOURCES.geodeticNetwork,
      minzoom: 13,
      layout: labelLayout,
      paint: labelPaint,
    });
  } else {
    setLayoutProperties(map, LAYERS.geodeticNetworkLabel, labelLayout);
    setPaintProperties(map, LAYERS.geodeticNetworkLabel, labelPaint);
  }
}
