import {
  MEASURE_SOURCE,
  MEASURE_LINE_LAYER,
  MEASURE_POINTS_LAYER,
  MEASURE_LABELS_LAYER,
} from "./layerConfig";

export const ensureMeasureLayerStyles = ({ map, emptyGeojson }) => {
  if (!map.getSource(MEASURE_SOURCE)) {
    map.addSource(MEASURE_SOURCE, {
      type: "geojson",
      data: emptyGeojson,
    });
  }

  if (!map.getLayer(MEASURE_LINE_LAYER)) {
    map.addLayer({
      id: MEASURE_LINE_LAYER,
      type: "line",
      source: MEASURE_SOURCE,
      filter: ["==", "$type", "LineString"],
      paint: {
        "line-color": "#ff0000",
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getLayer(MEASURE_POINTS_LAYER)) {
    map.addLayer({
      id: MEASURE_POINTS_LAYER,
      type: "circle",
      source: MEASURE_SOURCE,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ff0000",
      },
    });
  }

  if (!map.getLayer(MEASURE_LABELS_LAYER)) {
    map.addLayer({
      id: MEASURE_LABELS_LAYER,
      type: "symbol",
      source: MEASURE_SOURCE,
      filter: ["has", "distance"],
      layout: {
        "text-field": ["get", "distance"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 14,
        "text-anchor": "bottom",
        "text-offset": [0, -1],
      },
      paint: {
        "text-color": "#ff0000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }
};
