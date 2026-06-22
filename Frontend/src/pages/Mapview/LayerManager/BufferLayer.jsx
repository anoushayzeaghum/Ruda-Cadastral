import {
  BUFFER_SOURCE,
  BUFFER_FILL_LAYER,
  BUFFER_LINE_LAYER,
  BUFFER_CENTER_LAYER,
} from "./layerConfig";

export const BUFFER_RADIUS_M = 500;

export const addBufferLayerStyles = ({ map, featureCollection }) => {
  map.addSource(BUFFER_SOURCE, {
    type: "geojson",
    data: featureCollection,
  });

  map.addLayer({
    id: BUFFER_FILL_LAYER,
    type: "fill",
    source: BUFFER_SOURCE,
    filter: ["==", "$type", "Polygon"],
    paint: { "fill-color": "#9333ea", "fill-opacity": 0.12 },
  });

  map.addLayer({
    id: BUFFER_LINE_LAYER,
    type: "line",
    source: BUFFER_SOURCE,
    filter: ["==", "$type", "Polygon"],
    paint: { "line-color": "#9333ea", "line-width": 2 },
  });

  map.addLayer({
    id: BUFFER_CENTER_LAYER,
    type: "circle",
    source: BUFFER_SOURCE,
    filter: ["==", "$type", "Point"],
    paint: {
      "circle-radius": 5,
      "circle-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#9333ea",
    },
  });
};
