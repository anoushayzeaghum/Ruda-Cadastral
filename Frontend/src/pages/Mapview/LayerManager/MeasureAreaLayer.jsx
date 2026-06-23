import {
  MEASURE_AREA_SOURCE,
  MEASURE_AREA_FILL_LAYER,
  MEASURE_AREA_LINE_LAYER,
  MEASURE_AREA_POINTS_LAYER,
  MEASURE_AREA_LABEL_LAYER,
} from "./layerConfig";

export const ensureMeasureAreaLayerStyles = ({ map, emptyGeojson }) => {
  if (!map.getSource(MEASURE_AREA_SOURCE)) {
    map.addSource(MEASURE_AREA_SOURCE, {
      type: "geojson",
      data: emptyGeojson,
    });
  }

  if (!map.getLayer(MEASURE_AREA_FILL_LAYER)) {
    map.addLayer({
      id: MEASURE_AREA_FILL_LAYER,
      type: "fill",
      source: MEASURE_AREA_SOURCE,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": "#0066ff", "fill-opacity": 0.15 },
    });
  }

  if (!map.getLayer(MEASURE_AREA_LINE_LAYER)) {
    map.addLayer({
      id: MEASURE_AREA_LINE_LAYER,
      type: "line",
      source: MEASURE_AREA_SOURCE,
      filter: [
        "any",
        ["==", "$type", "LineString"],
        ["==", "$type", "Polygon"],
      ],
      paint: {
        "line-color": "#0066ff",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getLayer(MEASURE_AREA_POINTS_LAYER)) {
    map.addLayer({
      id: MEASURE_AREA_POINTS_LAYER,
      type: "circle",
      source: MEASURE_AREA_SOURCE,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0066ff",
      },
    });
  }

  if (!map.getLayer(MEASURE_AREA_LABEL_LAYER)) {
    map.addLayer({
      id: MEASURE_AREA_LABEL_LAYER,
      type: "symbol",
      source: MEASURE_AREA_SOURCE,
      filter: ["has", "areaLabel"],
      layout: {
        "text-field": ["get", "areaLabel"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 12,
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#003399",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }
};
