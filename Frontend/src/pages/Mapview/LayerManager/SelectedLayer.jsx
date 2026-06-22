import {
  SELECTED_SOURCE,
  SELECTED_FILL,
  SELECTED_LINE,
} from "./layerConfig";

export const ensureSelectedLayerStyles = ({ map, emptyGeojson }) => {
  if (!map.getSource(SELECTED_SOURCE)) {
    map.addSource(SELECTED_SOURCE, {
      type: "geojson",
      data: emptyGeojson,
    });
  }

  if (!map.getLayer(SELECTED_FILL)) {
    map.addLayer({
      id: SELECTED_FILL,
      type: "fill",
      source: SELECTED_SOURCE,
      paint: {
        "fill-color": "#facc15",
        "fill-opacity": 0.55,
      },
    });
  }

  if (!map.getLayer(SELECTED_LINE)) {
    map.addLayer({
      id: SELECTED_LINE,
      type: "line",
      source: SELECTED_SOURCE,
      paint: {
        "line-color": "#ca8a04",
        "line-width": 3,
      },
    });
  }
};
