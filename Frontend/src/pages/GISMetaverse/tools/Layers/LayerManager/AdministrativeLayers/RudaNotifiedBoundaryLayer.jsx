const EMPTY_FC = { type: "FeatureCollection", features: [] };

export const RUDA_NOTIFIED_BOUNDARY = {
  label: "Notified Boundary",
  endpoint: "/ruda-jurisdiction/",
  source: "metaverse-admin-ruda-notified-source",
  fill: "metaverse-admin-ruda-notified-fill",
  casing: "metaverse-admin-ruda-notified-casing",
  line: "metaverse-admin-ruda-notified-line",
  labelLayer: "metaverse-admin-ruda-notified-label",
};

export const DEFAULT_RUDA_NOTIFIED_STYLE = {
  color: "#065F46",
  fillColor: "#065F46",
  opacity: 100,
};

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const LABEL_EXPRESSION = [
  "coalesce",
  ["get", "name"],
  ["get", "Name"],
  ["get", "name_"],
  ["get", "jurisdiction"],
  ["get", "boundary_name"],
  ["get", "title"],
  "Notified Boundary",
];

export function setRudaNotifiedBoundaryVisibility(map, visible) {
  [
    RUDA_NOTIFIED_BOUNDARY.fill,
    RUDA_NOTIFIED_BOUNDARY.casing,
    RUDA_NOTIFIED_BOUNDARY.line,
    RUDA_NOTIFIED_BOUNDARY.labelLayer,
  ].forEach((id) => {
    if (map?.getLayer?.(id)) {
      map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    }
  });
}

export function addOrUpdateRudaNotifiedBoundary(
  map,
  geojson,
  style = DEFAULT_RUDA_NOTIFIED_STYLE,
) {
  if (!map) return;

  const hasGeoJSON = geojson?.type === "FeatureCollection";
  const data = hasGeoJSON ? geojson : EMPTY_FC;
  const opacity = clamp(style.opacity) / 100;
  const lineColor = style.color || "#065F46";
  const fillColor = style.fillColor || lineColor;

  if (!map.getSource(RUDA_NOTIFIED_BOUNDARY.source)) {
    map.addSource(RUDA_NOTIFIED_BOUNDARY.source, {
      type: "geojson",
      data,
    });
  } else if (hasGeoJSON) {
    map.getSource(RUDA_NOTIFIED_BOUNDARY.source).setData(data);
  }

  if (!map.getLayer(RUDA_NOTIFIED_BOUNDARY.fill)) {
    map.addLayer({
      id: RUDA_NOTIFIED_BOUNDARY.fill,
      type: "fill",
      source: RUDA_NOTIFIED_BOUNDARY.source,
      filter: [
        "match",
        ["geometry-type"],
        ["Polygon", "MultiPolygon"],
        true,
        false,
      ],
      paint: {
        "fill-color": fillColor,
        "fill-opacity": 0.055 * opacity,
      },
      layout: { visibility: "visible" },
    });
  } else {
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.fill,
      "fill-color",
      fillColor,
    );
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.fill,
      "fill-opacity",
      0.055 * opacity,
    );
    map.setLayoutProperty(
      RUDA_NOTIFIED_BOUNDARY.fill,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(RUDA_NOTIFIED_BOUNDARY.casing)) {
    map.addLayer({
      id: RUDA_NOTIFIED_BOUNDARY.casing,
      type: "line",
      source: RUDA_NOTIFIED_BOUNDARY.source,
      paint: {
        "line-color": "#1A1A1A",
        "line-width": 4,
        "line-opacity": 0.72 * opacity,
      },
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
    });
  } else {
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.casing,
      "line-opacity",
      0.72 * opacity,
    );
    map.setLayoutProperty(
      RUDA_NOTIFIED_BOUNDARY.casing,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(RUDA_NOTIFIED_BOUNDARY.line)) {
    map.addLayer({
      id: RUDA_NOTIFIED_BOUNDARY.line,
      type: "line",
      source: RUDA_NOTIFIED_BOUNDARY.source,
      paint: {
        "line-color": lineColor,
        "line-width": 2.4,
        "line-opacity": opacity,
        "line-dasharray": [5, 2, 1, 2],
      },
      layout: {
        visibility: "visible",
        "line-cap": "round",
        "line-join": "round",
      },
    });
  } else {
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.line,
      "line-color",
      lineColor,
    );
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.line,
      "line-opacity",
      opacity,
    );
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.line,
      "line-dasharray",
      [5, 2, 1, 2],
    );
    map.setLayoutProperty(
      RUDA_NOTIFIED_BOUNDARY.line,
      "visibility",
      "visible",
    );
  }

  if (!map.getLayer(RUDA_NOTIFIED_BOUNDARY.labelLayer)) {
    map.addLayer({
      id: RUDA_NOTIFIED_BOUNDARY.labelLayer,
      type: "symbol",
      source: RUDA_NOTIFIED_BOUNDARY.source,
      minzoom: 7,
      layout: {
        visibility: "visible",
        "symbol-placement": "point",
        "text-field": ["to-string", LABEL_EXPRESSION],
        "text-size": 11,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": lineColor,
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.4,
        "text-opacity": opacity,
      },
    });
  } else {
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.labelLayer,
      "text-color",
      lineColor,
    );
    map.setPaintProperty(
      RUDA_NOTIFIED_BOUNDARY.labelLayer,
      "text-opacity",
      opacity,
    );
    map.setLayoutProperty(
      RUDA_NOTIFIED_BOUNDARY.labelLayer,
      "visibility",
      "visible",
    );
  }
}
