import { getPointLabelLayerId } from "./layerConfig";

export const addPointLayerStyles = ({
  map,
  sourceId,
  layerId,
  geojson,
  color,
  strokeColor,
  radius,
  opacity = 0.95,
  labelLayerId = getPointLabelLayerId(layerId),
  labelExpression = null,
  labelColor = "#1f2937",
  labelMinZoom = 15,
  labelSize = ["interpolate", ["linear"], ["zoom"], 14, 10, 17, 12],
  labelOffset = [0, 1.15],
}) => {
  map.addSource(sourceId, {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        12,
        Math.max(radius - 1.5, 2),
        17,
        radius,
      ],
      "circle-color": color,
      "circle-stroke-width": 1.6,
      "circle-stroke-color": strokeColor,
      "circle-opacity": opacity,
    },
  });

  if (labelExpression) {
    map.addLayer({
      id: labelLayerId,
      type: "symbol",
      source: sourceId,
      minzoom: labelMinZoom,
      layout: {
        "text-field": labelExpression,
        "text-size": labelSize,
        "text-offset": labelOffset,
        "text-anchor": "top",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true,
      },
      paint: {
        "text-color": labelColor,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0.15,
      },
    });
  }
};
