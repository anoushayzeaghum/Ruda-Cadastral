import {
  SELECTED_CORNER_SOURCE,
  SELECTED_CORNER_LAYER,
  SELECTED_CORNER_BOX_LAYER,
  SELECTED_CORNER_TEXT_LAYER,
} from "./layerConfig";

export const buildCornerMarkerFeatureCollection = (feature) => {
  const geom = feature.geometry;
  let coords = [];

  if (geom.type === "Polygon") {
    coords = geom.coordinates?.[0] || [];
  } else if (geom.type === "MultiPolygon") {
    coords = geom.coordinates?.[0]?.[0] || [];
  }

  if (coords.length > 1) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      coords = coords.slice(0, coords.length - 1);
    }
  }

  const cornerFeatures = coords.slice(0, 4).map((c, idx) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [c[0], c[1]] },
    properties: { idx, label: String.fromCharCode(65 + idx) },
  }));

  return {
    type: "FeatureCollection",
    features: cornerFeatures,
  };
};

export const addCornerMarkerLayerStyles = ({ map, cornerFeatureCollection, demarcationMode }) => {
  map.addSource(SELECTED_CORNER_SOURCE, {
    type: "geojson",
    data: cornerFeatureCollection,
  });

  if (demarcationMode) {
    map.addLayer({
      id: SELECTED_CORNER_BOX_LAYER,
      type: "symbol",
      source: SELECTED_CORNER_SOURCE,
      layout: {
        "text-field": "■",
        "text-size": 45,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#000000",
      },
    });

    map.addLayer({
      id: SELECTED_CORNER_TEXT_LAYER,
      type: "symbol",
      source: SELECTED_CORNER_SOURCE,
      layout: {
        "text-field": ["get", "label"],
        "text-size": 18,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
    return;
  }

  map.addLayer({
    id: SELECTED_CORNER_LAYER,
    type: "circle",
    source: SELECTED_CORNER_SOURCE,
    paint: {
      "circle-radius": 6,
      "circle-color": "#111827",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
};
