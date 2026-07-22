import {
  KHASRA_SOURCE,
  KHASRA_FILL,
  KHASRA_LINE,
  KHASRA_LABEL,
  VECTOR_LAYER_THEME,
  VECTOR_LABEL_FIELDS,
} from "./layerConfig";

export const addKhasraLayerStyles = ({ map, geojson, opacity, color }) => {
  const khasraTheme = VECTOR_LAYER_THEME.khasra;
  const statusColor = color || khasraTheme.line;

  map.addSource(KHASRA_SOURCE, {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: KHASRA_FILL,
    type: "fill",
    source: KHASRA_SOURCE,
    paint: {
      "fill-color": statusColor,
      "fill-opacity": khasraTheme.fillOpacity * opacity,
      "fill-outline-color": statusColor,
    },
  });

  map.addLayer({
    id: KHASRA_LINE,
    type: "line",
    source: KHASRA_SOURCE,
    paint: {
      "line-color": statusColor,
      "line-width": khasraTheme.lineWidth,
      "line-opacity": 0.95,
    },
  });

  map.addLayer({
    id: KHASRA_LABEL,
    type: "symbol",
    source: KHASRA_SOURCE,
    minzoom: khasraTheme.labelMinZoom,
    layout: {
      "text-field": VECTOR_LABEL_FIELDS.khasra,
      "text-size": ["interpolate", ["linear"], ["zoom"], 16, 9, 19, 12],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-optional": true,
    },
    paint: {
      "text-color": statusColor,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.2,
      "text-halo-blur": 0.15,
    },
  });
};
