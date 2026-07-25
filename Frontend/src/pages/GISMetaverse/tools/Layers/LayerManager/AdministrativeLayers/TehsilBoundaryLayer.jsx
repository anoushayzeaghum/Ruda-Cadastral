const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const TEHSIL_BOUNDARY = {
  label: "Tehsil Boundary",
  endpoint: "/tehsil/",
  source: "metaverse-admin-tehsil-source",
  fill: "metaverse-admin-tehsil-fill",
  line: "metaverse-admin-tehsil-line",
  labelLayer: "metaverse-admin-tehsil-label",
};

export const DEFAULT_TEHSIL_STYLE = {
  color: "#000000",
  fillColor: "#000000",
  opacity: 100,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const LABEL_EXPRESSION = [
  "coalesce",
  ["get", "tehsil_name"],
  ["get", "tehsil"],
  ["get", "teh_name"],
  ["get", "name"],
  ["get", "Name"],
  ["get", "name_"],
  "",
];

export function setTehsilBoundaryVisibility(map, visible) {
  [
    TEHSIL_BOUNDARY.fill,
    TEHSIL_BOUNDARY.line,
    TEHSIL_BOUNDARY.labelLayer,
  ].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

export function addOrUpdateTehsilBoundary(
  map,
  geojson,
  style = DEFAULT_TEHSIL_STYLE,
) {
  if (!map) return;

  const hasGeoJSON = geojson?.type === "FeatureCollection";
  const data = hasGeoJSON ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;
  const lineColor = style.color || "#000000";

  if (!map.getSource(TEHSIL_BOUNDARY.source)) {
    map.addSource(TEHSIL_BOUNDARY.source, { type: "geojson", data });
  } else if (hasGeoJSON) {
    map.getSource(TEHSIL_BOUNDARY.source).setData(data);
  }

  if (!map.getLayer(TEHSIL_BOUNDARY.fill)) {
    map.addLayer({
      id: TEHSIL_BOUNDARY.fill,
      type: "fill",
      source: TEHSIL_BOUNDARY.source,
      filter: [
        "match",
        ["geometry-type"],
        ["Polygon", "MultiPolygon"],
        true,
        false,
      ],
      paint: {
        "fill-color": style.fillColor || lineColor,
        "fill-opacity": 0,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setPaintProperty(TEHSIL_BOUNDARY.fill, "fill-opacity", 0);
    map.setLayoutProperty(TEHSIL_BOUNDARY.fill, "visibility", "visible");
  }

  if (!map.getLayer(TEHSIL_BOUNDARY.line)) {
    map.addLayer({
      id: TEHSIL_BOUNDARY.line,
      type: "line",
      source: TEHSIL_BOUNDARY.source,
      paint: {
        "line-color": lineColor,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          0.8,
          10,
          1.1,
          14,
          1.3,
        ],
        "line-opacity": 0.92 * opacity,
        "line-dasharray": [3, 2],
      },
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
    });
  } else {
    map.setPaintProperty(TEHSIL_BOUNDARY.line, "line-color", lineColor);
    map.setPaintProperty(TEHSIL_BOUNDARY.line, "line-opacity", 0.92 * opacity);
    map.setPaintProperty(TEHSIL_BOUNDARY.line, "line-dasharray", [3, 2]);
    map.setLayoutProperty(TEHSIL_BOUNDARY.line, "visibility", "visible");
  }

  if (!map.getLayer(TEHSIL_BOUNDARY.labelLayer)) {
    map.addLayer({
      id: TEHSIL_BOUNDARY.labelLayer,
      type: "symbol",
      source: TEHSIL_BOUNDARY.source,
      minzoom: 8,
      layout: {
        visibility: "visible",
        "symbol-placement": "point",
        "text-field": ["to-string", LABEL_EXPRESSION],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          9,
          11,
          10.5,
          14,
          12,
        ],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": lineColor,
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.25,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setPaintProperty(TEHSIL_BOUNDARY.labelLayer, "text-color", lineColor);
    map.setPaintProperty(TEHSIL_BOUNDARY.labelLayer, "text-opacity", opacity);
    map.setLayoutProperty(TEHSIL_BOUNDARY.labelLayer, "visibility", "visible");
  }
}
