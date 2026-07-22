const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const DISTRICT_BOUNDARY = {
  label: "District Boundary",
  endpoint: "/district/",
  source: "metaverse-admin-district-source",
  fill: "metaverse-admin-district-fill",
  line: "metaverse-admin-district-line",
  labelLayer: "metaverse-admin-district-label",
};

export const DEFAULT_DISTRICT_STYLE = {
  color: "#1B3A5C",
  fillColor: "#1B3A5C",
  opacity: 100,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const LABEL_EXPRESSION = [
  "coalesce",
  ["get", "district_name"],
  ["get", "district"],
  ["get", "dist_name"],
  ["get", "name"],
  ["get", "Name"],
  ["get", "name_"],
  "",
];

export function setDistrictBoundaryVisibility(map, visible) {
  [
    DISTRICT_BOUNDARY.fill,
    DISTRICT_BOUNDARY.line,
    DISTRICT_BOUNDARY.labelLayer,
  ].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

export function addOrUpdateDistrictBoundary(
  map,
  geojson,
  style = DEFAULT_DISTRICT_STYLE,
) {
  if (!map) return;

  const hasGeoJSON = geojson?.type === "FeatureCollection";
  const data = hasGeoJSON ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;
  const lineColor = style.color || "#1B3A5C";
  const fillColor = style.fillColor || lineColor;

  if (!map.getSource(DISTRICT_BOUNDARY.source)) {
    map.addSource(DISTRICT_BOUNDARY.source, { type: "geojson", data });
  } else if (hasGeoJSON) {
    map.getSource(DISTRICT_BOUNDARY.source).setData(data);
  }

  if (!map.getLayer(DISTRICT_BOUNDARY.fill)) {
    map.addLayer({
      id: DISTRICT_BOUNDARY.fill,
      type: "fill",
      source: DISTRICT_BOUNDARY.source,
      filter: [
        "match",
        ["geometry-type"],
        ["Polygon", "MultiPolygon"],
        true,
        false,
      ],
      paint: {
        "fill-color": fillColor,
        "fill-opacity": 0.065 * opacity,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setPaintProperty(DISTRICT_BOUNDARY.fill, "fill-color", fillColor);
    map.setPaintProperty(
      DISTRICT_BOUNDARY.fill,
      "fill-opacity",
      0.065 * opacity,
    );
    map.setLayoutProperty(DISTRICT_BOUNDARY.fill, "visibility", "visible");
  }

  if (!map.getLayer(DISTRICT_BOUNDARY.line)) {
    map.addLayer({
      id: DISTRICT_BOUNDARY.line,
      type: "line",
      source: DISTRICT_BOUNDARY.source,
      paint: {
        "line-color": lineColor,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5,
          1.8,
          9,
          2.4,
          14,
          2.8,
        ],
        "line-opacity": opacity,
      },
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
    });
  } else {
    map.setPaintProperty(DISTRICT_BOUNDARY.line, "line-color", lineColor);
    map.setPaintProperty(DISTRICT_BOUNDARY.line, "line-opacity", opacity);
    map.setLayoutProperty(DISTRICT_BOUNDARY.line, "visibility", "visible");
  }

  if (!map.getLayer(DISTRICT_BOUNDARY.labelLayer)) {
    map.addLayer({
      id: DISTRICT_BOUNDARY.labelLayer,
      type: "symbol",
      source: DISTRICT_BOUNDARY.source,
      minzoom: 6,
      layout: {
        visibility: "visible",
        "symbol-placement": "point",
        "text-field": ["to-string", LABEL_EXPRESSION],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          10,
          10,
          12,
          14,
          14,
        ],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-letter-spacing": 0.06,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": lineColor,
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.5,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setPaintProperty(
      DISTRICT_BOUNDARY.labelLayer,
      "text-color",
      lineColor,
    );
    map.setPaintProperty(
      DISTRICT_BOUNDARY.labelLayer,
      "text-opacity",
      opacity,
    );
    map.setLayoutProperty(
      DISTRICT_BOUNDARY.labelLayer,
      "visibility",
      "visible",
    );
  }
}
