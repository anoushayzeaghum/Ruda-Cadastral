import {
  TRI_JUNCTION_POINTS_LABEL,
  TRI_JUNCTION_BURJI_LAYER,
  TRI_JUNCTION_BURJI_LABEL,
  TRI_JUNCTION_TRIANGLE_IMAGE,
  TRI_JUNCTION_TJ_FILTER,
  TRI_JUNCTION_BURJI_FILTER,
  VECTOR_LABEL_FIELDS,
  VECTOR_LAYER_THEME,
} from "./layerConfig";

export const ensureTriangleIcon = (map) => {
  if (!map || map.hasImage(TRI_JUNCTION_TRIANGLE_IMAGE)) return;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.lineTo(size - 8, size - 8);
  ctx.lineTo(8, size - 8);
  ctx.closePath();

  ctx.fillStyle = VECTOR_LAYER_THEME.trijunction.triangle;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = VECTOR_LAYER_THEME.trijunction.triangleStroke;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(TRI_JUNCTION_TRIANGLE_IMAGE, imageData);
};

export const addTriJunctionLayerStyles = ({ map, sourceId, layerId, pointGeojson, opacity }) => {
  ensureTriangleIcon(map);

  map.addSource(sourceId, {
    type: "geojson",
    data: pointGeojson,
  });

  map.addLayer({
    id: TRI_JUNCTION_BURJI_LAYER,
    type: "circle",
    source: sourceId,
    filter: TRI_JUNCTION_BURJI_FILTER,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 17, 6],
      "circle-color": VECTOR_LAYER_THEME.trijunction.burjiCircle,
      "circle-stroke-width": 1.6,
      "circle-stroke-color": VECTOR_LAYER_THEME.trijunction.burjiStroke,
      "circle-opacity": opacity,
    },
  });

  map.addLayer({
    id: layerId,
    type: "symbol",
    source: sourceId,
    filter: TRI_JUNCTION_TJ_FILTER,
    layout: {
      "icon-image": TRI_JUNCTION_TRIANGLE_IMAGE,
      "icon-size": 0.55,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  map.addLayer({
    id: TRI_JUNCTION_BURJI_LABEL,
    type: "symbol",
    source: sourceId,
    filter: TRI_JUNCTION_BURJI_FILTER,
    minzoom: 15,
    layout: {
      "text-field": ["literal", ""],
      "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 17, 12],
      "text-offset": [0, 1.15],
      "text-anchor": "top",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-optional": true,
    },
    paint: {
      "text-color": VECTOR_LAYER_THEME.trijunction.burjiLabel,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.25,
      "text-halo-blur": 0.15,
    },
  });

  map.addLayer({
    id: TRI_JUNCTION_POINTS_LABEL,
    type: "symbol",
    source: sourceId,
    filter: TRI_JUNCTION_TJ_FILTER,
    minzoom: 15,
    layout: {
      "text-field": VECTOR_LABEL_FIELDS.trijunction,
      "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 17, 12],
      "text-offset": [0, 1.35],
      "text-anchor": "top",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
      "text-optional": true,
    },
    paint: {
      "text-color": VECTOR_LAYER_THEME.trijunction.label,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.25,
      "text-halo-blur": 0.15,
    },
  });
};
