/**
 * Flood Extent 2025 Mapbox layer definition and helpers.
 * Data is loaded from the FloodExtent backend model as GeoJSON.
 */
export const FLOOD_LAYER = Object.freeze({
  key: "floodExtent2025",
  label: "Flood Extent 2025",
  sourceId: "flood-extent-2025-source",
  layerId: "flood-extent-2025-fill",
  color: "#2563eb",
  outlineColor: "#1e40af",
  fillOpacity: 0.45,
  dataAvailable: true,
});

export const addOrUpdateFloodLayer = (map, geojson) => {
  if (!map || !geojson) return;

  const existingSource = map.getSource(FLOOD_LAYER.sourceId);

  if (existingSource) {
    existingSource.setData(geojson);
  } else {
    map.addSource(FLOOD_LAYER.sourceId, {
      type: "geojson",
      data: geojson,
    });
  }

  if (!map.getLayer(FLOOD_LAYER.layerId)) {
    map.addLayer({
      id: FLOOD_LAYER.layerId,
      type: "fill",
      source: FLOOD_LAYER.sourceId,
      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-color": FLOOD_LAYER.color,
        "fill-opacity": FLOOD_LAYER.fillOpacity,
        "fill-outline-color": FLOOD_LAYER.outlineColor,
      },
    });
  } else {
    map.setPaintProperty(
      FLOOD_LAYER.layerId,
      "fill-color",
      FLOOD_LAYER.color,
    );
    map.setPaintProperty(
      FLOOD_LAYER.layerId,
      "fill-opacity",
      FLOOD_LAYER.fillOpacity,
    );
    map.setPaintProperty(
      FLOOD_LAYER.layerId,
      "fill-outline-color",
      FLOOD_LAYER.outlineColor,
    );
    map.setLayoutProperty(FLOOD_LAYER.layerId, "visibility", "visible");
  }
};

export const setFloodLayerVisibility = (map, visible) => {
  if (!map || !map.getLayer(FLOOD_LAYER.layerId)) return;

  map.setLayoutProperty(
    FLOOD_LAYER.layerId,
    "visibility",
    visible ? "visible" : "none",
  );
};

export default FLOOD_LAYER;
