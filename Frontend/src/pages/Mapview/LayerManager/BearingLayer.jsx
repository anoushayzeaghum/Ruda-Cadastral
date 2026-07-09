import {
  BEARING_SOURCE,
  BEARING_LINE_LAYER,
  BEARING_POINTS_LAYER,
  BEARING_LABEL_LAYER,
} from "./layerConfig";

export const ensureBearingLayerStyles = ({ map, emptyGeojson }) => {
  if (!map.getSource(BEARING_SOURCE)) {
    map.addSource(BEARING_SOURCE, {
      type: "geojson",
      data: emptyGeojson,
    });
  }

  if (!map.getLayer(BEARING_LINE_LAYER)) {
    map.addLayer({
      id: BEARING_LINE_LAYER,
      type: "line",
      source: BEARING_SOURCE,
      filter: ["==", "$type", "LineString"],
      paint: { "line-color": "#e67e00", "line-width": 2 },
    });
  }

  if (!map.getLayer(BEARING_POINTS_LAYER)) {
    map.addLayer({
      id: BEARING_POINTS_LAYER,
      type: "circle",
      source: BEARING_SOURCE,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 6,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#e67e00",
      },
    });
  }

  if (!map.getLayer(BEARING_LABEL_LAYER)) {
    map.addLayer({
      id: BEARING_LABEL_LAYER,
      type: "symbol",
      source: BEARING_SOURCE,
      filter: ["has", "bearingLabel"],
      layout: {
        "text-field": ["get", "bearingLabel"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
        "text-anchor": "bottom",
        "text-offset": [0, -1],
      },
      paint: {
        "text-color": "#b35000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }
};
