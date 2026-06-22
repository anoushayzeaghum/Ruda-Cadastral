import {
  MURABBA_SOURCE,
  MURABBA_FILL,
  MURABBA_LINE,
  MURABBA_LABEL,
  VECTOR_LAYER_THEME,
  VECTOR_LABEL_FIELDS,
} from "./layerConfig";

export const addMurabbaLayerStyles = ({ map, geojson, opacity }) => {
  const murabbaTheme = VECTOR_LAYER_THEME.murabba;

  map.addSource(MURABBA_SOURCE, {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: MURABBA_FILL,
    type: "fill",
    source: MURABBA_SOURCE,
    paint: {
      "fill-color": murabbaTheme.fill,
      "fill-opacity": murabbaTheme.fillOpacity * opacity,
      "fill-outline-color": murabbaTheme.line,
    },
  });

  map.addLayer({
    id: MURABBA_LINE,
    type: "line",
    source: MURABBA_SOURCE,
    paint: {
      "line-color": murabbaTheme.line,
      "line-width": murabbaTheme.lineWidth,
      "line-opacity": 0.95,
    },
  });

  map.addLayer({
    id: MURABBA_LABEL,
    type: "symbol",
    source: MURABBA_SOURCE,
    minzoom: murabbaTheme.labelMinZoom,
    layout: {
      "text-field": VECTOR_LABEL_FIELDS.murabba,
      "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 18, 12],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-optional": true,
    },
    paint: {
      "text-color": murabbaTheme.label,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.2,
      "text-halo-blur": 0.15,
    },
  });
};
