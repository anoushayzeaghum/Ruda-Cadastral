export const GEODETIC_POINTS_COLOR = "#D92D20";

export const GEODETIC_POINTS_IDS = {
  source: "metaverse-geodetic-network-source",
  circle: "metaverse-geodetic-network-circle",
  label: "metaverse-geodetic-network-label",
};

const LABEL_FONT = ["Open Sans Semibold", "Arial Unicode MS Bold"];

const setPaintProperties = (map, layerId, paint = {}) => {
  if (!map.getLayer(layerId)) return;

  Object.entries(paint).forEach(([property, value]) => {
    map.setPaintProperty(layerId, property, value);
  });
};

export function addGeodeticPointsLayer(
  map,
  data,
  color = GEODETIC_POINTS_COLOR,
  opacity = 1,
) {
  if (!map || !data) return;

  const source = map.getSource(GEODETIC_POINTS_IDS.source);
  if (source) {
    source.setData(data);
  } else {
    map.addSource(GEODETIC_POINTS_IDS.source, {
      type: "geojson",
      data,
    });
  }

  const circlePaint = {
    // Compact red points that remain visible without covering nearby parcels.
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      3,
      13,
      4,
      17,
      5.5,
    ],
    "circle-color": color,
    "circle-opacity": opacity,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.4,
    "circle-stroke-opacity": opacity,
  };

  if (!map.getLayer(GEODETIC_POINTS_IDS.circle)) {
    map.addLayer({
      id: GEODETIC_POINTS_IDS.circle,
      type: "circle",
      source: GEODETIC_POINTS_IDS.source,
      paint: circlePaint,
      layout: { visibility: "visible" },
    });
  } else {
    setPaintProperties(map, GEODETIC_POINTS_IDS.circle, circlePaint);
    map.setLayoutProperty(
      GEODETIC_POINTS_IDS.circle,
      "visibility",
      "visible",
    );
  }

  const labelPaint = {
    "text-color": color,
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.2,
    "text-opacity": opacity,
  };

  if (!map.getLayer(GEODETIC_POINTS_IDS.label)) {
    map.addLayer({
      id: GEODETIC_POINTS_IDS.label,
      type: "symbol",
      source: GEODETIC_POINTS_IDS.source,
      minzoom: 13,
      layout: {
        visibility: "visible",
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "code"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
        "text-font": LABEL_FONT,
        "text-allow-overlap": false,
      },
      paint: labelPaint,
    });
  } else {
    setPaintProperties(map, GEODETIC_POINTS_IDS.label, labelPaint);
    map.setLayoutProperty(
      GEODETIC_POINTS_IDS.label,
      "visibility",
      "visible",
    );
  }
}
